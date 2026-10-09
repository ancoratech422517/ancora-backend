from flask import Blueprint , request , jsonify
from models.database import Amizade , Turma_Aula , db

Convidae_Usuario_Turma = Blueprint("Convidar_Usuario_Turma" , __name__)
@Convidae_Usuario_Turma.route("/convidar_usuario_turma" , methods = ["POST"])
def ConvidarUsuarioTurma():
    try:
        dados = request.get_json()
        id_usuario = dados.get("id_usuario")
        id_turma = dados.get("id_turma")
        id_convidado = dados.get("id_convidado")
        nome_Turma = dados.get("nome_Turma")

        dados_turma_actual = Turma_Aula.query.filter(
            Turma_Aula.id == int(id_turma)
        ).first()


        turma_convite_existente = Amizade.query.filter(
            Amizade.id_turma_convite == str(id_turma),
            Amizade.destinatario_id == int(id_convidado)
        ).first()
        

        if turma_convite_existente:
            print("vc ja fez um convite para este usuario")
            return jsonify({"resposta":"você já fez um convite para este usuario."})
        #verifica se o usuario já faz parte da turma
        ja_faz_parte = Turma_Aula.query.filter(
            Turma_Aula.id_aluno_Turma == str(id_convidado),
            Turma_Aula.nome_Turma == nome_Turma
        ).first()
        if ja_faz_parte:
            print("este usuario já faz parte da turma")
            return jsonify({"resposta":"este usuario já faz parte da sua turma."})
        
        dados = {
            "destinatario_id":id_convidado,
            "remetente_id":id_usuario,
            "tipo_notificacao":"convite_turma",
            "foto_usuario":dados_turma_actual.imagem_perfil_Turma,
            "id_turma_convite":id_turma,
            "nome_Turma":nome_Turma,
        }
        novo_pedido = Amizade(**dados)
        db.session.add(novo_pedido)
        db.session.commit()

        print(f"teste dos dados recebidos: {dados}")
        return jsonify({"resposta":"convite enviado"})
    
    except Exception as erro:
        print(f"erro ao buscar os dados:{erro}")
        return jsonify({"resposta":"erro"})
    
    
