import { useMemo } from "react";
import "./css/ConteinerRightWindowProdutsScroll.css"
import Conteiner2RightWindowProdutsCard from "./Conteiner2RightWindowProdutsCard";
import Loja from "../../assets/loja.jfif"
import Mascote from "../../assets/mascote2.webm"
import { useUserStore } from "../../useUseSotore";
import Loading3 from "../components/conteinerComponentesJsx/loading3";
import Conteiner2RightWindowProdutoCardComentarioUsuario from "./Conteiner2RightWindowProdutoCardComentarioUsuario";
export default function ConteinerRightWindowProdutsScroll () {
    const { TodosProdutos } = useUserStore()

    // Agrupamento dos produtos por tipo_produto + reorganização
    const { groupedProducts, produtosDestaque, produtosAdorados, produtosPorCategoriaAdorada, todosProdutosCategoriasAdoradas } = useMemo(() => {
        if (!TodosProdutos || TodosProdutos.length === 0) {
            return { 
                groupedProducts: {}, 
                produtosDestaque: [], 
                produtosAdorados: [],
                produtosPorCategoriaAdorada: {},
                todosProdutosCategoriasAdoradas: []
            };
        }

        // ==================== PRODUTOS QUE O USUÁRIO ADORA ====================
        const produtosAdorados = TodosProdutos.filter(item => 
            item.estado_adoro === "True" || item.estado_adoro === "True"
        );

        // ==================== NOVA LÓGICA: CATEGORIAS QUE O USUÁRIO ADORA ====================
        const categoriasAdoradas = [...new Set(
            produtosAdorados.map(item => item?.tipo_produto?.trim()).filter(Boolean)
        )];

        // Pegar até 5 produtos de cada categoria que o usuário adora
        const produtosPorCategoriaAdorada = {};
        categoriasAdoradas.forEach(categoria => {
            const produtosDaCategoria = TodosProdutos
                .filter(item => item?.tipo_produto?.trim() === categoria)
                .slice(0, 5);

            if (produtosDaCategoria.length > 0) {
                produtosPorCategoriaAdorada[categoria] = produtosDaCategoria;
            }
        });

        // ==================== NOVA LÓGICA: TODOS OS PRODUTOS EM UM ÚNICO CONTÊINER ====================
        const todosProdutosCategoriasAdoradas = TodosProdutos
            .filter(item => {
                const tipo = item?.tipo_produto?.trim();
                return tipo && categoriasAdoradas.includes(tipo);
            });

        // 1. Agrupa normal primeiro
        const grupos = TodosProdutos.reduce((acc, item) => {
            const tipoProduto = item && item.tipo_produto ? item.tipo_produto.trim() : "Sem Categoria";

            if (!acc[tipoProduto]) {
                acc[tipoProduto] = [];
            }
            
            acc[tipoProduto].push(item);
            return acc;
        }, {});

        // 2. Reorganiza: categorias com menos de 3 produtos vão pra "Outros"
        const MIN_PRODUTOS_POR_SECAO = 4;
        const gruposReorganizados = {};
        const produtosOutros = [];

        Object.entries(grupos).forEach(([categoria, produtos]) => {
            if (produtos.length >= MIN_PRODUTOS_POR_SECAO) {
                gruposReorganizados[categoria] = produtos;
            } else {
                produtosOutros.push(...produtos);
            }
        });

        if (produtosOutros.length > 0) {
            gruposReorganizados["Outros"] = [
               ...(gruposReorganizados["Outros"] || []),
               ...produtosOutros
            ];
        }

        // 3. Pega 1 produto de cada uma das 4 primeiras categorias reorganizadas
        const destaque = Object.keys(gruposReorganizados)
         .slice(0, 4)
         .map(categoria => gruposReorganizados[categoria]?.[0])
         .filter(Boolean);

        return {
            groupedProducts: gruposReorganizados,
            produtosDestaque: destaque,
            produtosAdorados,
            produtosPorCategoriaAdorada,
            todosProdutosCategoriasAdoradas
        };
    }, [TodosProdutos]);

    return (
        <div className="ConteinerRightWindowProdutsScroll">
            {/* INICIO DA FORMATAÇÃO DA HERO INICIAL */}
            <div className="ConteinerRightWindowProdutsScrollHome">
                <div className="ConteinerRightWindowScrollHomeFundoLoja">
                    <img src={Loja} alt="" />
                </div>
                <div className="ConteinerRightWindowScrollHomeConteudo">
                    <div className="ConteinerRightWindowScrollHomeConteudoBoxLeft">
                        <button>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            Premium Marketplace
                        </button>
                        <h1>
                            <li>Curate Your</li> Luxury Life
                        </h1>
                        <li>
                            Discover thousands of premium products from verified vendors worldwide. Enterprise-grade shopping experience.
                        </li>
                        <div className="ConteinerRightWindowScrollHomeConteudoBoxLeftBtns">
                            <button>Explore Colletion</button>
                            <button>Become a Vendedor</button>
                        </div>
                    </div>
                    <div className="ConteinerRightWindowScrollHomeConteudoBoxRight">
                        <video src={Mascote} autoPlay loop muted playsInline></video>
                    </div>
                </div>
            </div>

            <div className="ConteinerRightWindowScrolHeroBottom">
                {/* ... todo o conteúdo do hero bottom permanece igual ... */}
                <div className="ConteinerRightWindowScrolHeroBottomBox">
                    <div className="ConteinerRightWindowScrolHeroBottomIcone">
                        <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                    </div>
                    <div className="ConteinerRightWindowScrolHeroBottomCont">
                        <b>Security payments</b>
                        <li>256-bit SSL encrypted</li>
                    </div>
                </div>

                <div className="ConteinerRightWindowScrolHeroBottomBox">
                    <div className="ConteinerRightWindowScrolHeroBottomIcone">
                        <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                        </svg>
                    </div>
                    <div className="ConteinerRightWindowScrolHeroBottomCont">
                        <b>Free Shipping</b>
                        <li>On orders $150+</li>
                    </div>
                </div>

                <div className="ConteinerRightWindowScrolHeroBottomBox">
                    <div className="ConteinerRightWindowScrolHeroBottomIcone">
                        <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                    </div>
                    <div className="ConteinerRightWindowScrolHeroBottomCont">
                        <b>24/7 Support</b>
                        <li>Dedicated team</li>
                    </div>
                </div>
            </div>

            <div className="ConteinerRightWindowScrollCategoria">
                <h1>Shop by Category</h1>
                <li>Explore our curated collections</li>
            </div>

            <div className="ConteinerTodasCategoriasDesponiveis">
                {produtosDestaque.length > 0? (
                    produtosDestaque.map((item) => (
                        <div key={item.id || item.tipo_produto} className="categoria-destaque-card">
                            <Conteiner2RightWindowProdutsCard dados={item} />
                        </div>
                    ))
                ) : (
                    <p className="carregando_produto">
                        <Loading3 />
                        <b>carregando produto...</b>
                    </p>
                )}
            </div>

            {/* ===================== NOVA SEÇÃO: TODOS OS PRODUTOS DAS CATEGORIAS ADORADAS (ÚNICO CONTÊINER) ===================== */}
            {todosProdutosCategoriasAdoradas && todosProdutosCategoriasAdoradas.length > 0 && (
                <div className="categoria-section categorias-adoradas-section">
                    <h3 className="categoria-titulo destaque-adorados">
                        ❤️ Produtos das Categorias que Você Adora
                        <span className="categoria-count">({todosProdutosCategoriasAdoradas.length})</span>
                    </h3>
                    <div className="categoria-produtos-container">
                        {todosProdutosCategoriasAdoradas.map((item, index) => (
                            <Conteiner2RightWindowProdutsCard
                                key={item.id || `todos-adorados-${index}`}
                                dados={item}
                            />
                        ))}
                    </div>
                </div>
            )}
            {/* ===================== FIM DA NOVA SEÇÃO ===================== */}

            {/* FIM DA FORMATAÇÃO DA HERO INICIAL */}
            <div className="ConteinerRightWindowCategoriasText">
                <b>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    AI Curated
                </b>
                <h1>Curated For You</h1>
                <li>Products selected based on your preferences</li>
            </div>
            {/* INICIO DA FORMATAÇÃO DO CONTEINER DO TRAFEGO PADO DO CLIENTE */}
            {/* <div className="ConteinerProdutosTrafegoPagoCliente">
                <div className="ConteinerProdutosTrafegoPagoClienteBox">
                    <div className="ConteinerProdutosTrafegoPagoClienteBoxTop">
                        <div className="ConteinerProdutosTrafegoPagoClienteBoxTopBox1">
                            <div className="DivBtnTrafego">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"></path></svg>
                                <b>Produtos Premium</b>
                            </div>
                            <h1>Flash Sale</h1>
                            <li>Up to 70% off premium products</li>
                        </div>

                    </div>
                    <div className="ConteinerProdutosTrafegoPagoClienteBoxTopBox2">
                        <div className="ConteinerProdutosTrafegoPagoClienteBoxTopBox2Card"></div>
                        <div className="ConteinerProdutosTrafegoPagoClienteBoxTopBox2Card"></div>
                        <div className="ConteinerProdutosTrafegoPagoClienteBoxTopBox2Card"></div>
                        <div className="ConteinerProdutosTrafegoPagoClienteBoxTopBox2Card"></div>
                        <div className="ConteinerProdutosTrafegoPagoClienteBoxTopBox2Card"></div>
                        <div className="ConteinerProdutosTrafegoPagoClienteBoxTopBox2Card"></div>

                    </div>
                </div>
            </div> */}
            {/* SEÇÕES POR CATEGORIA REORGANIZADAS */}
            {TodosProdutos && TodosProdutos.length > 0? (
                <>
                    {Object.entries(groupedProducts).map(([tipoProduto, produtosDaCategoria]) => (
                        <div key={tipoProduto} className="categoria-section">
                            <h3 className="categoria-titulo">
                                {tipoProduto}
                                <span className="categoria-count">({produtosDaCategoria.length})</span>
                            </h3>
                            <div className="categoria-produtos-container">
                                {produtosDaCategoria.map((item, index) => (
                                    <Conteiner2RightWindowProdutsCard
                                        key={item.id || index}
                                        dados={item}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* SEÇÃO FINAL COM TODOS OS PRODUTOS */}
                    <div className="categoria-section todos-produtos-section">
                        <h3 className="categoria-titulo">
                            Todos os Produtos
                            <span className="categoria-count">({TodosProdutos.length})</span>
                        </h3>
                        <div className="categoria-produtos-container">
                            {TodosProdutos.map((item, index) => (
                                <Conteiner2RightWindowProdutsCard
                                    key={item.id || `todos-${index}`}
                                    dados={item}
                                />
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <p style={{color: "gray", textAlign: "center", width:"100%"}}>
                    Nenhum produto registrado na plataforma
                </p>
            )}
            {/* <div className="ConteinerRightWindowProdutosScrollComentario">
                <h1>Saiba o que os outros utilizadores acham da <b>Ancora E-commerce</b> </h1>
                <li>estes são os usuarios mais ativos e fies da Ancora Ecommerce as suas opniões são de bom grato escutadas para que os usuarios tenham uma noa perfomence na Ancora</li>
                <li>tenha mais confiança nas suas compras ouvindo opniões de quem já fez a sua venda ou compra na ancora ecommerce.</li>
            </div>
            <div className="ConteinerRightWindowProdutosScrollComentarioConteiner">
                <Conteiner2RightWindowProdutoCardComentarioUsuario />
                <Conteiner2RightWindowProdutoCardComentarioUsuario />
                <Conteiner2RightWindowProdutoCardComentarioUsuario />
                <Conteiner2RightWindowProdutoCardComentarioUsuario />
                <Conteiner2RightWindowProdutoCardComentarioUsuario />
                <Conteiner2RightWindowProdutoCardComentarioUsuario />
                
            </div> */}
        </div>

    )
}