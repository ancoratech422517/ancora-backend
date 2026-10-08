from flask import Blueprint, request, jsonify
import cloudinary.uploader
import os
from service.api_register import register_user

registrar = Blueprint("registrar", __name__)
caminho = "static/dados/usuario"

@registrar.route("/api/Registrar", methods=["POST"])
def registro():
    try:
        # Pegar dados do formulário
        nome = request.form.get("nome")
        email = request.form.get("email")
        senha = request.form.get("senha")
        confirmar_senha = request.form.get("confirmar_senha")
        telefone = request.form.get("telefone")
        data_nascimento = request.form.get("data_nascimento")
        continente = request.form.get("continente")
        pais = request.form.get("pais")
        provincia = request.form.get("provincia")
        capital = request.form.get("capital")
        bairro = request.form.get("bairro")

        foto = request.files.get("foto")

        # URL da foto (padrão caso não envie foto)
        foto_url = None

        if foto and foto.filename != "":
            try:
                # Upload para o Cloudinary
                upload_result = cloudinary.uploader.upload(
                    foto,
                    folder="usuarios/fotos_perfil",           # Organiza as fotos
                    overwrite=True,
                    resource_type="image"
                )
                foto_url = upload_result.get("secure_url")    # URL HTTPS

                print(f"✅ Foto enviada para Cloudinary: {foto_url}")
            except Exception as erro:
                foto.seek(0)
                print(f"erro ao armazenar o arquivo nas nuvens:{erro}")
                print("-"*40)
                print("Registrando o arquivo localmente...")
                novo_nome = foto.filename.replace(" ","_")
                urlFoto = f"http://127.0.0.1:5000/{caminho}/{novo_nome}"
                if not os.path.exists(caminho):
                    os.makedirs(caminho , exist_ok=True)
                foto.save(os.path.join(caminho , novo_nome))
                foto_url = urlFoto
                print("Arquivo armazenado localmente")
                

        # Chamar o serviço de registro
        serviço = register_user()
        resultado = serviço.registrar_usuario(
            nome=nome,
            telefone=telefone,
            senha=senha,
            confirmar_senha=confirmar_senha,
            email=email,
            data_nascimento=data_nascimento,
            foto=foto_url,                    # ← Agora passa a URL do Cloudinary
            continente=continente,
            pais=pais,
            provincia=provincia,
            capital=capital,
            bairro=bairro
        )

        return jsonify({"status": resultado})

    except Exception as e:
        print("❌ Erro no registro:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({"status": "erro", "message": str(e)}), 500