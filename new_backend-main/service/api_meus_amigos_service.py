from models.database import Amigo, Menssagens, Usuario
from routes.websoket_conectUser import usuarios_online


class Meus_amigos:

  @staticmethod
  def Listar_todos_meus_amigos(usuario_id):
    meus_amigos = Amigo.query.filter(Amigo.id_usuario == usuario_id).all()

    lista_amigo = []

    for amigo in meus_amigos:
      # 1. Busca mensagens não lidas
      quantidade_menssagem_nao_lida = Menssagens.query.filter_by(
          id_remitente=amigo.id_amigo,
          nossa_sala=amigo.nossa_sala,
          lida=False,
      ).count()

      lastMensssage = ""
      HoraMenssagem = None  # Inicializa como None por segurança

      try:
        ultima_menssagem = (
            Menssagens.query.filter(Menssagens.nossa_sala == amigo.nossa_sala)
            .order_by(Menssagens.id.desc())
            .first()
        )
        if ultima_menssagem:
          lastMensssage = ultima_menssagem.menssagem
          HoraMenssagem = ultima_menssagem.data_envio
      except Exception as erro:
        print(f"ainda não foram criadas nenhuma menssagem nesta sala: {erro}")

      # 2. LÓGICA DE STATUS
      status = (
          "online" if str(amigo.id_amigo) in usuarios_online else "offline"
      )

      # BUSCAR A IMAGEM ACTUAL DO BANCO DE DADOS
      foto_amigo_actual = Usuario.query.filter(
          Usuario.id == amigo.id_amigo
      ).first()
      if foto_amigo_actual:
        amigo.foto_amigo = foto_amigo_actual.foto_usuario
      else:
        amigo.foto_amigo = ""

      lista_amigo.append({
          "id_amigo": amigo.id_amigo,
          "nossa_sala": amigo.nossa_sala,
          "nome": amigo.dados_amigo.nome,
          "foto_amigo": amigo.foto_amigo,
          "quantidade_menssagem_nao_lida": quantidade_menssagem_nao_lida,
          "status": status,
          "ultima_menssagem": lastMensssage,
          "HoraMenssagem": HoraMenssagem,
      })

    # --- ORDENAÇÃO PELO MAIS RECENTE ---
    # Coloca no topo quem tem a HoraMenssagem mais recente (decrescente).
    # Usamos uma data mínima (datetime.min) para quem nunca enviou mensagem ir para o final.
    from datetime import datetime

    lista_amigo.sort(
        key=lambda x: x["HoraMenssagem"]
        if x["HoraMenssagem"] is not None
        else datetime.min,
        reverse=True,
    )

    return lista_amigo