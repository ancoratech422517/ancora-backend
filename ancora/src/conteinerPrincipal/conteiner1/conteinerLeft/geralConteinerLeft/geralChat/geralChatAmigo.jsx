import { useState , useEffect } from "react";
import "../css/GeralChatAmigo.css"
import Amigo from "../../../../components/conteinerSvg/amigo";
import GeralChatAmigoDados from "./geralChatAmigoDados";
import { GeraChatDadosAmigos } from "../js/geralChatDadosAmigos";
import SetaEsquerda from "../../../../components/conteinerSvg/setaEsquerda";
import { useUserStore } from "../../../../../useUseSotore";
import IMG3 from "../../../../../assets/IMGPERFIL.png"
import { GeralChatAmigoSolicitarEntradaGrupo } from "../js/geralChatAmigoSolicitarEntradaGrupo";
export default function GeralChatAmigo ({setViewChat}) {
    const {
            socket , 
            setMenssagemNaoLida , 
            dadosUsuario,
            FotoPerfilUsuario , 
            setFotoPerfilUsuario,
            DADOSUSUARIO,
            DADOSPRODUTO,
            DADOSTURMA,
            DADOSTOTALAMIGO,
            DADOSTOTALPRODUTO,
            DADOSTOTALTURMAUSUARIO
        } = useUserStore()
        const dados_usuario_perfil = {}
        const dados_total_amigo = {}
        const dados_total_turma = {}
        const dados_turma_usuario = {}
        const TotalProdutoUsuario = {}
        DADOSUSUARIO.map((dados)=>{
            dados_usuario_perfil["nome_usuario"] = dados.nome_usuario
            dados_usuario_perfil["pais"] = dados.pais
            dados_usuario_perfil["provincia"] = dados.provincia
            dados_usuario_perfil["capital"] = dados.capital
            dados_usuario_perfil["id_usuario"] = dados.id_usuario
            dados_usuario_perfil["foto_usuario"] = dados.foto_usuario
        })

        DADOSTOTALAMIGO.map((dados)=>{
            dados_total_amigo["TotalAmigoUsuario"] = dados.TotalAmigoUsuario
        })

        DADOSTOTALTURMAUSUARIO.map((dados)=>{
            dados_total_turma["TotalTurmaUsuario"] = dados.TotalTurmaUsuario
        })
        DADOSTOTALPRODUTO.map((dados)=>{
            TotalProdutoUsuario["TotalProdutoUsuario"] = dados.TotalProdutoUsuario
        })


    const condicao_FotoPerfilUsuario = () =>{

        switch(FotoPerfilUsuario){
            case true:
                return (
                    <div className="GeralChatAmigoConteinerPerfilUsuario">
                        <div className="GeralChatAmigoConteinerPerfilUsuarioImgUser">
                            <img src={dados_usuario_perfil.foto_usuario} alt="" />
                        </div>
                        
                            <h2> {dados_usuario_perfil.nome_usuario} </h2>
                        
                        <div className="GeralChatAmigoConteinerPerfilUsuarioInformacao">
                            <div className="GeralChatAmigoConteinerPerfilUsuarioInformacaoBoxs">
                                <b>Localização</b>
                                <li>{dados_usuario_perfil.provincia}/ {dados_usuario_perfil.pais}</li>
                            </div>
                            <div className="GeralChatAmigoConteinerPerfilUsuarioInformacaoBoxs">
                                <b>Toatal de Amigo</b>
                                <li>({dados_total_amigo.TotalAmigoUsuario})amigos</li>
                            </div>
                            <div className="PerfilMarcaAncora">
                                <img src={IMG3} alt="" />
                                
                            </div>
                        </div>
                        <div className="GeralChatAmigoConteinerPerfilUsuarioInformacaoTurma">
                            <b className="tealTurmaPerfilUser" >({dados_total_turma.TotalTurmaUsuario})Turmas</b>
                            <div className="GeralChatAmigoConteinerPerfilUsuarioInformacaoTurmaConteinerScroll">
                                {DADOSTURMA.map((dados)=>{
                                    
                                    return(
                                        <div className="GeralChatAmigoConteinerPerfilUsuarioInformacaoTurmaConteinerScrollDados">
                                            <div className="GeralChatAmigoConteinerPerfilUsuarioInformacaoTurmaConteinerScrollDadosImgTurma">
                                                <img src={dados.imagem_perfil_Turma} alt="" />
                                            </div>
                                            <div className="GeralChatAmigoConteinerPerfilUsuarioInformacaoTurmaConteinerScrollDadosInformacaoTurma">
                                                <b>{dados.nome_Turma}</b>
                                                <li>(<b>{dados.TotalAlunoTurmaResultado}</b>) Memnbros, <button onClick={()=>{GeralChatAmigoSolicitarEntradaGrupo(dadosUsuario.id , dadosUsuario.nome_usuario , dadosUsuario.foto_usuario , dados.id_admin_Turma , dados.id_turma , dados.nome_Turma)}}>solicitar entrada</button> </li>
                                                <div className={`GeralChatAmigoSolicitacaoResposta aviso_solicitacao_turma_${dados.id_turma}`}>
                                                    <li>solicitação enviada</li>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}

                            </div>
                        </div>
                        <div className="GeralChatAmigoConteinerPerfilUsuarioInformacaoProduto">
                            <b>({TotalProdutoUsuario.TotalProdutoUsuario})Produtos</b>

                            <div className="GeralChatAmigoConteinerPerfilUsuarioInformacaoProdutoConteinerScroll">
                                {DADOSPRODUTO.map((dados)=>{
                                    return(
                                        <div className="GeralChatAmigoConteinerPerfilUsuarioInformacaoProdutoConteinerScrollDados" >
                                            <img src={dados.url_imagem_produto} alt="" />
                                        </div> 
                                    )   
                                })}
                                
                            </div>
                        </div>
                        <div className="GeralChatAmigoConteinerPerfilUsuarioVoltar" onClick={()=>{setFotoPerfilUsuario(false)}}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left-short" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5"/>
                            </svg>
                        </div>
                    </div>
                )
        }
    }
    
    const [listar_usuario , setListarUsuario] = useState([])
    const [pesquisaAmigo, setPesquisaAmigo] = useState("")
    useEffect(()=>{
        const carregar =  async ()=>{
            const dados = await GeraChatDadosAmigos()
            setListarUsuario(Array.isArray(dados) ? dados : [])
        }
        carregar()
    } , [])

    const termoPesquisa = pesquisaAmigo
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
    const telefonePesquisa = pesquisaAmigo.replace(/\D/g, "")
    const usuariosFiltrados = listar_usuario.filter((usuario) => {
        const nome = String(usuario.nome ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
        const telefone = String(usuario.telefone ?? "").replace(/\D/g, "")

        return nome.includes(termoPesquisa) || (
            telefonePesquisa.length > 0 && telefone.includes(telefonePesquisa)
        )
    })

    return (
        <div className="GeralChatAmigo">
            <div className="GeralChatAmigoMenu">
                <div className="GeralChatAmigoMenuBox">
                    <div className="GeralChatAmigoMenuBoxCaxa1">
                        <button onClick={()=> setViewChat("chat")}>
                            <SetaEsquerda />
                        </button>
                    </div>
                    <div className="GeralChatAmigoMenuBoxCaxa2">
                        <h2>Amigo</h2>
                        <Amigo />
                    </div>
                </div>
                <div className="GeralChatAmigoMenuBox">
                    <input
                        type="search"
                        placeholder="Pesquisar por nome ou telefone"
                        aria-label="Pesquisar amigo por nome ou telefone"
                        id="search"
                        value={pesquisaAmigo}
                        onChange={(evento) => setPesquisaAmigo(evento.target.value)}
                    />
                </div>
            </div>
            <div className="GeralChatAmigoConteinerScroll">
                {usuariosFiltrados.length > 0 ? (
                    usuariosFiltrados.map((usuario)=>(
                        <GeralChatAmigoDados key={usuario.id} dados = {usuario} />
                    ))
                ) : (
                    <p>Nenhum usuário encontrado.</p>
                )}
                
            </div>
            {condicao_FotoPerfilUsuario()}
        </div>
    )
}