from flask import Blueprint , request , jsonify
from models.database import Cliente_vendedor , db , Usuario

ClienteVendedor = Blueprint("ClienteVendedor" , __name__)

@ClienteVendedor("/buscar_cliente_vendedor<int: dadosUsuario>" , methods = ["GET"])
def Cliente__Vendedor(dadosUsuario_id):
    try:
        Cliente_vendedor_Base_de_dados = Cliente_vendedor.query.filter(
            Cliente_vendedor.id_vendedor == int(dadosUsuario_id)
        ).first()
        if not Cliente_vendedor_Base_de_dados:
            print("nenhum cliente registrado na base de dados deste usuario")
            return jsonify({"status":"nenum dados para este cliente"})
        else:
            lista_cliente = []
            foto_cliene_vendedor = ""
            for x in Cliente_vendedor_Base_de_dados:
                foto_cliente = Usuario.query.filter(
                    Usuario.id == int(x.id_cliente)
                ).first()
                if not foto_cliente:
                    print("nenhuma foto encontrada")
                else:
                    foto_cliene_vendedor = foto_cliente.foto_usuario
                item = {
                    "nome_cliente": x.nome_cliente,
                    "produto_cliente":x.nome_produto,
                    "foto_cliente": foto_cliene_vendedor
                }
                lista_cliente.append(item)
            return jsonify(item) , 200
    except Exception as erro:
        print(f"erro ao buscar os clientes do usuario:{erro}")
        return jsonify({"status":erro})
    