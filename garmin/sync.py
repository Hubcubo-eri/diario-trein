"""Sincroniza dados do Garmin Connect com o Supabase do Diário.

Roda no GitHub Actions (ver .github/workflows/garmin-sync.yml).

Para cada dia grava uma linha `garmin_AAAA-MM-DD` na tabela `days` com:
calorias (ativas, basal, total), passos, sono, FC de repouso,
body battery, estresse e as atividades registradas no relógio.

O app nunca escreve nessas linhas, então nada do que você digita é
sobrescrito pelo Garmin (e vice-versa).

Token: o Garmin pode renovar o refresh token a cada uso. Por isso o token
mais recente é salvo CRIPTOGRAFADO na linha `garmin_token` (a chave fica
só no secret GARMIN_TOKEN_KEY). O secret GARMIN_TOKENS é o token inicial,
usado só se o salvo no banco não funcionar.

Variáveis de ambiente:
  GARMIN_TOKENS      token gerado pelo garmin/login_local.py (JSON)
  GARMIN_TOKEN_KEY   chave Fernet gerada pelo login_local.py
  SUPABASE_URL       (padrão: o mesmo do app)
  SUPABASE_KEY       (padrão: a chave publishable do app)
  SYNC_DAYS          quantos dias para trás sincronizar (padrão 2)
  SYNC_START         opcional, data inicial AAAA-MM-DD (para importar histórico)
"""

from __future__ import annotations

import json
import os
import sys
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import requests
from cryptography.fernet import Fernet, InvalidToken
from garminconnect import Garmin

TZ = ZoneInfo("America/Sao_Paulo")
SUPABASE_URL = os.getenv("SUPABASE_URL") or "https://jfogpofhrbzjwgsbxyuv.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or "sb_publishable_U9oYnGamRl_nVOmseQUn_A_SN3peIWq"
TOKEN_ROW = "garmin_token"

# Tipo de atividade do Garmin -> id usado no app
ACTIVITY_MAP = {
    "surfing": "surf",
    "lap_swimming": "natacao", "open_water_swimming": "natacao", "swimming": "natacao",
    "running": "corrida", "treadmill_running": "corrida", "trail_running": "corrida",
    "track_running": "corrida", "indoor_running": "corrida", "street_running": "corrida",
    "cycling": "bike", "indoor_cycling": "bike", "road_biking": "bike",
    "mountain_biking": "bike", "gravel_cycling": "bike", "virtual_ride": "bike",
    "walking": "caminhada", "hiking": "caminhada", "casual_walking": "caminhada",
    "strength_training": "academia", "fitness_equipment": "academia",
    "indoor_cardio": "academia", "hiit": "academia", "elliptical": "academia",
    "stair_climbing": "academia", "indoor_rowing": "academia",
    "yoga": "alongamento", "pilates": "alongamento", "breathwork": "alongamento",
    "mobility": "alongamento", "stretching": "alongamento",
    "soccer": "futebol", "football": "futebol",
    "tennis": "beach", "padel": "beach", "pickleball": "beach",
    "bouldering": "outra",
    "boxing": "jiujitsu", "mixed_martial_arts": "jiujitsu", "martial_arts": "jiujitsu",
}


# ─── Supabase ────────────────────────────────────────────────────────────
def _headers() -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }


def sb_get(row_id: str):
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/days",
        params={"id": f"eq.{row_id}", "select": "data"},
        headers=_headers(),
        timeout=30,
    )
    r.raise_for_status()
    rows = r.json()
    return rows[0]["data"] if rows else None


def sb_upsert(row_id: str, data: dict) -> None:
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/days",
        params={"on_conflict": "id"},
        headers={**_headers(), "Prefer": "resolution=merge-duplicates,return=minimal"},
        data=json.dumps({"id": row_id, "data": data, "updated_at": datetime.now(timezone.utc).isoformat()}),
        timeout=30,
    )
    if r.status_code >= 300:
        raise RuntimeError(f"Supabase recusou gravar '{row_id}': HTTP {r.status_code} {r.text[:200]}")


# ─── Token ───────────────────────────────────────────────────────────────
def load_saved_token(fernet: Fernet | None) -> str | None:
    if not fernet:
        return None
    try:
        row = sb_get(TOKEN_ROW)
        if row and row.get("enc"):
            return fernet.decrypt(row["enc"].encode()).decode()
    except InvalidToken:
        print("⚠️  Token salvo no banco não abre com a GARMIN_TOKEN_KEY atual — ignorando.")
    except Exception as e:  # noqa: BLE001
        print(f"⚠️  Não consegui ler o token salvo: {type(e).__name__}")
    return None


def save_token(fernet: Fernet | None, token_json: str) -> None:
    if not fernet:
        print("⚠️  Sem GARMIN_TOKEN_KEY: o token renovado não será salvo.")
        return
    enc = fernet.encrypt(token_json.encode()).decode()
    sb_upsert(TOKEN_ROW, {"enc": enc, "savedAt": datetime.now(TZ).isoformat()})


def login() -> tuple[Garmin, Fernet | None]:
    key = os.getenv("GARMIN_TOKEN_KEY", "").strip()
    fernet = Fernet(key.encode()) if key else None

    candidates = [("banco", load_saved_token(fernet)), ("secret", os.getenv("GARMIN_TOKENS", "").strip() or None)]
    last_err = None
    for source, token in candidates:
        if not token:
            continue
        try:
            g = Garmin()
            g.login(tokenstore=token)
            print(f"✓ Login no Garmin com token do {source}")
            return g, fernet
        except Exception as e:  # noqa: BLE001
            last_err = e
            print(f"✗ Token do {source} falhou: {type(e).__name__}")
    sys.exit(
        "Não foi possível entrar no Garmin. Rode `python garmin/login_local.py` no seu "
        f"computador e atualize o secret GARMIN_TOKENS. ({type(last_err).__name__ if last_err else 'sem token'})"
    )


# ─── Coleta ──────────────────────────────────────────────────────────────
def _safe(fn, *args):
    try:
        return fn(*args)
    except Exception as e:  # noqa: BLE001
        print(f"  · {fn.__name__} indisponível ({type(e).__name__})")
        return None


def _int(v):
    try:
        return int(round(float(v)))
    except (TypeError, ValueError):
        return None


def map_activity(a: dict) -> dict:
    type_key = (a.get("activityType") or {}).get("typeKey") or ""
    app_type = ACTIVITY_MAP.get(type_key, "outra")
    start = a.get("startTimeLocal") or ""
    dist_m = a.get("distance") or 0
    intensity = None
    te = a.get("aerobicTrainingEffect")
    if te is not None:
        intensity = "leve" if te < 2 else "moderada" if te < 3.5 else "intensa"
    return {
        "id": f"g_{a.get('activityId')}",
        "garminId": a.get("activityId"),
        "type": app_type,
        "name": a.get("activityName") or "",
        "garminType": type_key,
        "t": start[11:16] if len(start) >= 16 else "",
        "dur": _int((a.get("duration") or 0) / 60) or "",
        "dist": round(dist_m / 1000, 2) if dist_m else "",
        "kcal": _int(a.get("calories")) or "",
        "fc": _int(a.get("averageHR")) or "",
        "fcMax": _int(a.get("maxHR")) or "",
        "intensity": intensity,
    }


def collect_day(g: Garmin, d: date) -> dict:
    ds = d.isoformat()
    stats = _safe(g.get_stats, ds) or {}
    sleep = _safe(g.get_sleep_data, ds) or {}
    acts = _safe(g.get_activities_by_date, ds, ds) or []

    sleep_dto = sleep.get("dailySleepDTO") or {}
    sleep_score = ((sleep_dto.get("sleepScores") or {}).get("overall") or {}).get("value")

    return {
        "source": "garmin",
        "syncedAt": datetime.now(TZ).isoformat(timespec="minutes"),
        "cal": {
            "a": _int(stats.get("activeKilocalories")),
            "b": _int(stats.get("bmrKilocalories")),
            "t": _int(stats.get("totalKilocalories")),
        },
        "steps": _int(stats.get("totalSteps")),
        "stepsGoal": _int(stats.get("dailyStepGoal")),
        "rhr": _int(stats.get("restingHeartRate")),
        "stress": _int(stats.get("averageStressLevel")),
        "bodyBattery": {
            "max": _int(stats.get("bodyBatteryHighestValue")),
            "min": _int(stats.get("bodyBatteryLowestValue")),
            "now": _int(stats.get("bodyBatteryMostRecentValue")),
        },
        "sleep": {
            "min": _int((sleep_dto.get("sleepTimeSeconds") or 0) / 60) or None,
            "score": _int(sleep_score),
            "deepMin": _int((sleep_dto.get("deepSleepSeconds") or 0) / 60) or None,
            "remMin": _int((sleep_dto.get("remSleepSeconds") or 0) / 60) or None,
        },
        "activities": [map_activity(a) for a in acts if a.get("activityId")],
    }


def date_range() -> list[date]:
    today = datetime.now(TZ).date()
    start_env = os.getenv("SYNC_START", "").strip()
    if start_env:
        start = date.fromisoformat(start_env)
    else:
        days = max(1, int(os.getenv("SYNC_DAYS", "2") or 2))
        start = today - timedelta(days=days - 1)
    n = (today - start).days + 1
    return [start + timedelta(days=i) for i in range(max(0, n))]


def main() -> None:
    g, fernet = login()
    ok = 0
    try:
        for d in date_range():
            data = collect_day(g, d)
            sb_upsert(f"garmin_{d.isoformat()}", data)
            ok += 1
            # Só contagens no log (logs de Actions podem ser públicos)
            print(f"✓ {d.isoformat()}: {len(data['activities'])} atividade(s)")
    finally:
        # Guarda o token (possivelmente renovado) para a próxima execução
        try:
            save_token(fernet, g.client.dumps())
            print("✓ Token atualizado e salvo (criptografado)")
        except Exception as e:  # noqa: BLE001
            print(f"⚠️  Não consegui salvar o token renovado: {type(e).__name__}")
    print(f"Pronto: {ok} dia(s) sincronizado(s).")


if __name__ == "__main__":
    main()
