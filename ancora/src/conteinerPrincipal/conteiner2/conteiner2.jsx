import { useMemo } from "react";
import { toast } from "sonner";
import Home from "../../../ancora/client/src/pages/Home";
import ImageDefault from "../../assets/image_card.png";
import Loja from "../../assets/loja.jfif";
import { useUserStore } from "../../useUseSotore";
import { parseKwanzas } from "../../utils/formatCurrency";
import { Sistema_de_adoro_dinamico } from "./js/ConteinerSistemaAdoro";
import { CloseSombraCard } from "./js/Conteiner2SomraCard";
import Conteiner2RightWindowProdutsSombra from "./Conteiner2RightWindowProdutsMarketPlaceSompbra";
import "./css/Conteiner2.css";
import "./marketplace.css";

const productTones = ["tone-sand", "tone-ink", "tone-teal", "tone-rose", "tone-stone", "tone-clay"];

function parsePrice(value) {
    const price = parseKwanzas(value);
    return Number.isFinite(price) ? price : 0;
}

function getProductImage(path, baseUrl) {
    if (!path) return ImageDefault;
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    return `${baseUrl.replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
}

export default function Conteiner2() {
    const { TodosProdutos, urlBancoDeDados, setDadosSombra } = useUserStore();
    const products = useMemo(() => (Array.isArray(TodosProdutos) ? TodosProdutos : [])
        .map((product, index) => ({
            id: product.id,
            name: product.nome_produto || "Produto sem nome",
            category: product.tipo_produto || "Geral",
            price: parsePrice(product.preco_produto),
            likes: Number(product.quantidade_adoro_produto) || 0,
            isFavorite: product.estado_adoro === true || product.estado_adoro === "True",
            seller: product.nome_vendedor || "",
            image: getProductImage(product.url_imagem_produto, urlBancoDeDados),
            tone: productTones[index % productTones.length],
            description: product.descricao_produto || "Fale com o vendedor para saber mais sobre este produto.",
            source: product,
        })), [TodosProdutos, urlBancoDeDados]);

    const openProduct = (product) => {
        if (!product?.source) return;
        void CloseSombraCard(product.source, setDadosSombra).catch((error) => {
            console.error("Não foi possível registar a visualização do produto:", error);
            toast.error("Não foi possível abrir os detalhes do produto.");
        });
    };

    const toggleFavorite = (product) => {
        const source = product?.source;
        if (!source?.id) {
            toast.error("Não foi possível identificar este produto.");
            return;
        }
        void Sistema_de_adoro_dinamico(
            source.id,
            () => {},
            source.estado_adoro === true || source.estado_adoro === "True" ? "True" : "False",
            () => {},
            Number(source.quantidade_adoro_produto) || 0,
        );
    };

    const startCheckout = (items) => {
        const selectedItem = items[0];
        if (!selectedItem) return;
        if (items.length > 1) {
            toast.info("O pagamento atual é iniciado produto a produto. Vamos abrir o primeiro item do carrinho.");
        }
        openProduct(selectedItem);
    };

    return (
        <div className="Conteiner2">
            <div className="Conteiner2RightMarketPlace ancora-marketplace">
                <Home
                    products={products}
                    currency="AOA"
                    location="Angola"
                    heroImage={products[0]?.image || Loja}
                    onToggleFavorite={toggleFavorite}
                    onSelectProduct={openProduct}
                    onCheckout={startCheckout}
                />
                <Conteiner2RightWindowProdutsSombra />
            </div>
        </div>
    );
}
