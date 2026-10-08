from flask import Blueprint , request , jsonify
from models.database import Amizade , db

Recusar_Convite_Turma = Blueprint("Recusar_Convite_Turma" , __name__)
@Recusar_Convite_Turma.route("/recusar_convite_turma" , methods = ["POST"])
def recusar_convite_turma():
    try:
        dados = request.get_json()
        id_turma = dados.get("id_turma")
        Amizade.query.filter(
            Amizade.id_turma_convite == id_turma
        ).delete()
        db.session.commit()
        print(f"notificação eleminada e convite recusado! id:{id_turma}")
        return jsonify({"resposta":"notificação eliminada"})
    except Exception as erro:
        print(f"erro ao eliminar a notificação:{erro}")
        return jsonify({"resposta":"erro regeitar o convite"})
    

