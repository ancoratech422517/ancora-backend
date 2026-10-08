import { useEffect, useState, useCallback } from "react"; 
import "./css/menuConteinerLeft.css"
import BoxTopMenuConteinerLeft from "./boxTopMenuConteinerLeft"
import BoxButtonConteinerLeft from "./boxButtonConteinerLeft";
import { useUserStore } from "../../../useUseSotore";

export default function MenuConteinerLeft({ ativarConteiner, setDadosUsuario }) {
    const { socket, dadosUsuario, setNotificacoes, setAmigos , setMenssagemLida , amigos  , setProdutoUsuario , setTodosProdutos , setPedidosProdutos , urlBancoDeDados } = useUserStore();
    const [jaBuscou, setJaBuscou] = useState(false);
    const amigo = useUserStore((state) => state.amigos);
    // 1. Definimos a função FORA do useEffect para que todos possam usar
    const buscar_notificacao = useCallback(() => {
        if (!dadosUsuario?.id) return;

        console.log("🔄 Sincronizando notificações com o servidor...");
        fetch(`${urlBancoDeDados}/notificacoes/${dadosUsuario.id}`)
            .then(res => res.json())
            .then(dados => {
                if (Array.isArray(dados)) {
                    setNotificacoes(dados);
                }
            })
            .catch(err => console.error("Erro ao buscar notificações:", err));
    }, [dadosUsuario?.id, setNotificacoes]);

        // 3. Busca inicial ao carregar (Amigos)
    useEffect(() => {
        if (dadosUsuario?.id && !jaBuscou) {
            fetch(`${urlBancoDeDados}/api/get/meus_amigos/${dadosUsuario.id}`)
                .then(res => res.json())
                .then(dados => {
                    if (Array.isArray(dados)) {
                        setAmigos(dados);
                        setJaBuscou(true); // Trava as buscas automáticas iniciais
                    }
                })
                .catch(err => {
                    console.error("Erro na busca de amigos", err);
                    setJaBuscou(true);
                });
        }
    }, [dadosUsuario?.id, jaBuscou, setAmigos]);



    const buscar_quantidade_menssagem =  useCallback(()=>{
        if(!dadosUsuario?.id) return;
        amigo.map((friend)=>(
            fetch(`${urlBancoDeDados}/buscar_quantidade_menssagem/${friend.id_amigo}/${friend.nossa_sala}`)
            .then(res => res.json())
            .then(dados =>{
                setMenssagemLida(dados)
            })
            .catch(err => console.log("erro ao ir buscar a quantiadde de menssagem no servidor:",err))
        ))
    } , [dadosUsuario?.id , setMenssagemLida])

    //buscar os produtos do usuario
    const buscar_produto_usuario = useCallback(()=>{
        if(!dadosUsuario?.id) return;
        fetch(`${urlBancoDeDados}/buscar_produto_usuario/${dadosUsuario?.id}`)
        .then(res=> res.json())
        .then(dados => {
            setProdutoUsuario(dados)
        } )
    } , [dadosUsuario?.id , setProdutoUsuario])

    //buscar todos os produtos da plantaforma
    const buscar_todos_produtos_da_plantaforma = useCallback(()=>{
        if(!dadosUsuario?.id) return;
        fetch(`${urlBancoDeDados}/buscar_todos_produtos/${dadosUsuario?.id}`)
        .then(res => res.json())
        .then(dados => {
            setTodosProdutos(dados)
        })
        .catch(erro =>{
            alert(erro)
        })
    } , [dadosUsuario?.id , setTodosProdutos])

    const buscar_pedidos_produto = useCallback(()=>{
        if(!dadosUsuario?.id) return;
        fetch(`${urlBancoDeDados}/buscar_pedidos_produtos/meus_pedidos/${dadosUsuario?.id}`)
        .then(res => res.json())
        .then(dados =>{
            setPedidosProdutos(dados)
        })
    } , [dadosUsuario?.id , setPedidosProdutos])



    // 2. Busca inicial ao carregar (Notificações)
    useEffect(() => {
        if (dadosUsuario?.id && !jaBuscou) {
            buscar_notificacao();
            // Não marcamos jaBuscou aqui ainda para garantir que a lista de amigos também carregue
        }
    }, [dadosUsuario?.id, jaBuscou, buscar_notificacao]);

    useEffect(()=>{
        if(dadosUsuario?.id){
            buscar_quantidade_menssagem()
        }
    } , [dadosUsuario?.id , buscar_quantidade_menssagem])

    //buscar produto usuario
    useEffect(()=>{
        if(dadosUsuario?.id){
            buscar_produto_usuario()
            
        }
    }, [dadosUsuario?.id , buscar_produto_usuario])

    
  

    //buscar todos os produtos
    useEffect(()=>{
        if(dadosUsuario?.id){
            buscar_todos_produtos_da_plantaforma()
        }
    } , [dadosUsuario?.id , buscar_todos_produtos_da_plantaforma])
    useEffect(()=>{
        if(dadosUsuario?.id){
            buscar_pedidos_produto()
        }
    } , [dadosUsuario?.id , buscar_pedidos_produto])

    // ==================== OUVINTE PARA PRODUTO REGISTRADO ====================
    // ==================== OUVINTE PARA PRODUTO REGISTRADO (VERSÃO FORÇADA) ====================
    useEffect(() => {
        if (!socket) return;

        const handleProdutoRegistrado = (novoProduto) => {
            console.log("🟢 Novo produto recebido via socket:", novoProduto);

            if (!novoProduto || !novoProduto.id) {
                console.warn("Produto recebido inválido:", novoProduto);
                return;
            }

            setProdutoUsuario((prev) => {
                const anterior = Array.isArray(prev) ? prev : [];
                
                const jaExiste = anterior.some(p => String(p?.id) === String(novoProduto.id));
                if (jaExiste) {
                    console.log("Produto já existe, ignorando duplicado");
                    return anterior;
                }

                // FORÇA NOVA REFERÊNCIA DE FORMA AGRESSIVA
                const novaLista = [novoProduto, ...anterior];
                console.log(`Adicionando produto. Total agora: ${novaLista.length}`);

                // Esta linha é a mais importante para resolver o teu caso
                return JSON.parse(JSON.stringify(novaLista)); 
                // ou return [...novaLista];  (podes experimentar as duas)
            });
        };

        socket.on("produto_registrado", (data)=> {
            buscar_produto_usuario()
            buscar_todos_produtos_da_plantaforma()
        });

        return () => {
            socket.off("produto_registrado", handleProdutoRegistrado);
        };
    }, [socket, setProdutoUsuario]);
    // ====================================================================================    // ====================================================================================


    // 4. Ouvindo a notificação em tempo real
    useEffect(() => {
        if (!socket) return;

        const handleNotificacao = (data) => {
            
            console.log("🔔 Nova notificação via Socket:", data);
            
            buscar_notificacao(); 
        };

        socket.on('receber_notificacao', handleNotificacao);

        // Limpeza para não duplicar escutadores
        return () => socket.off('receber_notificacao', handleNotificacao);
    }, [socket, buscar_notificacao]); 

    return (
        <div className="menuConteinerLeft">
            <BoxTopMenuConteinerLeft 
                ativarConteiner={ativarConteiner} 
                setDadosUsuario={setDadosUsuario} 
            />
            {/* <BoxButtonConteinerLeft />     */}
        </div>
    );
}