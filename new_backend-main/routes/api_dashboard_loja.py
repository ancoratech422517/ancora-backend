from collections import Counter
from datetime import date, datetime

from flask import Blueprint, current_app, g, jsonify

from models.database import Pedidos_Produto, Registrar_produto, Usuario, db
from service.referral_codes import gerar_codigo_convite


dashboard_loja = Blueprint("dashboard_loja", __name__)
MONTHS_PT = ("Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez")
PENDING_STATUSES = {"pendente", "por tratar", "em processamento"}


def _count(value):
    try:
        return max(0, int(float(str(value or "0").strip())))
    except (TypeError, ValueError, OverflowError):
        return 0


def _month_start(offset):
    current = date.today().replace(day=1)
    month_index = current.year * 12 + current.month - 1 + offset
    return date(month_index // 12, month_index % 12 + 1, 1)


def _as_date(value):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value or "")[:10])
    except ValueError:
        return None


def _as_iso(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value) if value else None


@dashboard_loja.route("/api/dashboard/loja", methods=["GET"])
def obter_dashboard_loja():
    try:
        user_id = int(g.principal["sub"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Sessão inválida"}), 401

    try:
        products = db.session.query(
            Registrar_produto,
            Usuario.foto_usuario,
            Usuario.foto_usuario_blurhash,
        ).join(
            Usuario, Usuario.id == Registrar_produto.id_usuario,
        ).filter(
            Registrar_produto.id_usuario == user_id,
        ).order_by(Registrar_produto.id.desc()).all()
        orders = db.session.query(
            Pedidos_Produto.nome_produto,
            Pedidos_Produto.id_cliente,
            Pedidos_Produto.estado_entraga,
            Pedidos_Produto.data_envio,
            Usuario.nome,
            Usuario.foto_usuario,
        ).join(
            Usuario, Usuario.id == Pedidos_Produto.id_cliente,
        ).filter(
            Pedidos_Produto.id_vendedor == user_id,
            Pedidos_Produto.pedido == "cliente",
        ).all()
        account = db.session.get(Usuario, user_id)
        if account is None:
            return jsonify({"error": "Conta não encontrada."}), 404
        if not account.codigo_convite:
            account.codigo_convite = gerar_codigo_convite()
            while db.session.query(Usuario.id).filter_by(
                codigo_convite=account.codigo_convite
            ).first():
                account.codigo_convite = gerar_codigo_convite()
            db.session.commit()

        affiliate_query = db.session.query(
            Usuario.id,
            Usuario.nome,
            Usuario.foto_usuario,
            Usuario.data_criacao,
        ).filter(Usuario.convidado_por_id == user_id)
        affiliate_total = affiliate_query.count()
        affiliate_rows = affiliate_query.order_by(Usuario.id.desc()).limit(100).all()
        affiliate_dates = db.session.query(Usuario.data_criacao).filter(
            Usuario.convidado_por_id == user_id,
        ).all()

        orders_by_product = Counter()
        orders_by_customer = Counter()
        customers = {}
        first_order_by_customer = {}
        for order in orders:
            product_name = (order.nome_produto or "").strip()
            if product_name:
                orders_by_product[product_name] += 1

            customer_id = order.id_cliente
            orders_by_customer[customer_id] += 1
            customer = customers.setdefault(customer_id, {
                "id": customer_id,
                "nome": order.nome or "Cliente",
                "foto": order.foto_usuario,
                "pedidos": 0,
                "pedidos_pendentes": 0,
                "produtos": Counter(),
            })
            customer["pedidos"] += 1
            if str(order.estado_entraga or "").strip().casefold() in PENDING_STATUSES:
                customer["pedidos_pendentes"] += 1
            if product_name:
                customer["produtos"][product_name] += 1

            order_date = str(order.data_envio or "")[:10]
            if len(order_date) == 10 and order_date[4:5] == "-" and order_date[7:8] == "-":
                previous_date = first_order_by_customer.get(customer_id)
                if previous_date is None or order_date < previous_date:
                    first_order_by_customer[customer_id] = order_date

        customer_rows = []
        for customer in customers.values():
            top_customer_product = customer["produtos"].most_common(1)
            customer_rows.append({
                "id": customer["id"],
                "nome": customer["nome"],
                "foto": customer["foto"],
                "pedidos": customer["pedidos"],
                "pedidos_pendentes": customer["pedidos_pendentes"],
                "produto_mais_comprado": top_customer_product[0][0] if top_customer_product else None,
            })
        customer_rows.sort(key=lambda item: (-item["pedidos"], item["nome"].casefold()))

        product_rows = [
            {
                "id": product.id,
                "nome": product.nome_produto,
                "visualizacoes": _count(product.visualizacao_produto),
                "favoritos": _count(product.quantidade_adoro_produto),
                "pedidos": orders_by_product.get((product.nome_produto or "").strip(), 0),
            }
            for product, _, _ in products
        ]
        product_rows.sort(
            key=lambda item: (-item["visualizacoes"], -item["favoritos"], (item["nome"] or "").casefold())
        )
        top_product_name, top_product_orders = (
            sorted(orders_by_product.items(), key=lambda item: (-item[1], item[0].casefold()))[0]
            if orders_by_product
            else (None, 0)
        )

        new_customers_by_month = Counter()
        for first_order_date in first_order_by_customer.values():
            month = first_order_date[:7]
            new_customers_by_month[month] += 1
        customer_series = [
            {
                "label": MONTHS_PT[month.month - 1],
                "value": new_customers_by_month.get(month.strftime("%Y-%m"), 0),
            }
            for month in (_month_start(offset) for offset in range(-5, 1))
        ]

        new_affiliates_by_month = Counter()
        for (created_at,) in affiliate_dates:
            created_date = _as_date(created_at)
            if created_date:
                new_affiliates_by_month[created_date.strftime("%Y-%m")] += 1
        affiliate_series = [
            {
                "label": MONTHS_PT[month.month - 1],
                "value": new_affiliates_by_month.get(month.strftime("%Y-%m"), 0),
            }
            for month in (_month_start(offset) for offset in range(-5, 1))
        ]

        return jsonify({
            "produtos": len(products),
            "produtos_detalhe": product_rows[:50],
            "produtos_lista": [
                {
                    "id": product.id,
                    "nome_produto": product.nome_produto,
                    "descricao_produto": product.descricao_produto,
                    "tipo_produto": product.tipo_produto,
                    "preco_produto": product.preco_produto,
                    "url_imagem_produto": product.url_imagem_produto,
                    "url_imagem_produto_blurhash": product.url_imagem_produto_blurhash,
                    "image_source_url": product.image_source_url,
                    "image_creator": product.image_creator,
                    "image_license": product.image_license,
                    "id_usuario": user_id,
                    "nome_vendedor": product.nome_vendedor,
                    "foto_vendedor": foto_vendedor,
                    "foto_vendedor_blurhash": foto_vendedor_blurhash,
                    "avalicao_produto_estrela": product.avalicao_produto_estrela,
                    "visualizacao_produto": product.visualizacao_produto,
                    "quantidade_encomenda_produto": product.quantidade_encomenda_produto,
                    "quantidade_adoro_produto": product.quantidade_adoro_produto,
                    "valor_antigo_produto": product.valor_antigo_produto,
                    "preco_antigo": product.valor_antigo_produto,
                    "estado_adoro": None,
                }
                for product, foto_vendedor, foto_vendedor_blurhash in products
            ],
            "pedidos": len(orders),
            "pedidos_pendentes": sum(
                str(order.estado_entraga or "").strip().casefold() in PENDING_STATUSES
                for order in orders
            ),
            "clientes": len(orders_by_customer),
            "clientes_recorrentes": sum(count > 1 for count in orders_by_customer.values()),
            "clientes_detalhe": customer_rows[:100],
            "clientes_serie": customer_series,
            "visualizacoes": sum(_count(product.visualizacao_produto) for product, _, _ in products),
            "favoritos": sum(_count(product.quantidade_adoro_produto) for product, _, _ in products),
            "produto_mais_pedido": {
                "nome": top_product_name,
                "pedidos": top_product_orders,
            },
            "codigo_convite": account.codigo_convite,
            "afiliados_total": affiliate_total,
            "afiliados": [
                {
                    "id": affiliate.id,
                    "nome": affiliate.nome or "Afiliado",
                    "foto": affiliate.foto_usuario,
                    "data_registro": _as_iso(affiliate.data_criacao),
                }
                for affiliate in affiliate_rows
            ],
            "afiliados_serie": affiliate_series,
            "afiliados_disponivel": True,
        }), 200
    except Exception:
        current_app.logger.exception("Falha ao carregar o dashboard da loja")
        return jsonify({"error": "Não foi possível carregar os dados da loja."}), 500
