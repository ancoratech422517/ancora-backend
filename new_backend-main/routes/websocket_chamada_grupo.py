from routes.websocket import socketio 
from routes.websoket_conectUser import usuarios_online
from models.database import Turma_Aula




@socketio.on("chamada_grupo")
def chamada_grupo(data):
    try:
        salaTurma = data.get("sala")
        idRemitente = data.get("id_remitente")
        nossa_sala = Turma_Aula.query.filter(
            Turma_Aula.sala_Turma == salaTurma
        ).all()
        for aluno in nossa_sala:
            if usuarios_online[aluno.id_aluno_Turma]:
                if str(idRemitente) != aluno.id_aluno_Turma:
                    print("o aluno esta online.")
                    dados_sala = {
                        "nome_turma":aluno.nome_Turma,
                        "imagem_perfil_Turma":aluno.imagem_perfil_Turma,
                        "sala_Turma":aluno.sala_Turma
                    }
                    socketio.emit("turma_ligar_aluno" , dados_sala , room = str(aluno.id_aluno_Turma))
                else:
                    print("este é o remitente avelino!")
            else:
                print(f"o aluno não esta online")
    except Exception as erro:
        print(f"ouve um erro ao emitir a chamada para os alunos:{erro}")