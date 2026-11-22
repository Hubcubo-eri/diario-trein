"""Login único no Garmin — rode no SEU computador, não no GitHub.

    cd diario-trein
    python3 -m venv .venv && source .venv/bin/activate
    pip install -r garmin/requirements.txt
    python garmin/login_local.py

Ele pede e-mail, senha e (se tiver) o código de 2 fatores, e imprime
dois valores para você colar nos Secrets do GitHub:

  GARMIN_TOKENS     -> o token de acesso (NÃO é a sua senha)
  GARMIN_TOKEN_KEY  -> chave que criptografa o token renovado no banco

A senha não é salva em lugar nenhum.
"""

from getpass import getpass

from cryptography.fernet import Fernet
from garminconnect import Garmin


def main() -> None:
    email = input("E-mail do Garmin Connect: ").strip()
    password = getpass("Senha (não aparece enquanto digita): ")

    g = Garmin(email, password, prompt_mfa=lambda: input("Código de verificação (2FA): ").strip())
    g.login()
    token = g.client.dumps()
    key = Fernet.generate_key().decode()

    name = (getattr(g, "full_name", None) or getattr(g, "display_name", None) or "").strip()
    print("\n✓ Login OK" + (f" — {name}" if name else ""))
    print("\nNo GitHub: Settings → Secrets and variables → Actions → New repository secret\n")
    print("Nome: GARMIN_TOKENS")
    print("Valor (copie a linha inteira):")
    print(token)
    print("\nNome: GARMIN_TOKEN_KEY")
    print("Valor:")
    print(key)
    print("\n⚠️  Trate esses valores como senha: não mande por chat/e-mail.")


if __name__ == "__main__":
    main()
