import "./css/BoxButtomConteinerLeft.css"
import Button6 from "../../components/conteinerComponentesJsx/btn6";
import { useUserStore } from "../../../useUseSotore";
import Perfil from "../../../assets/img_fundo_vazio/perfil.png"
export default function ({ativarConteiner}){
    const {dadosUsuario} = useUserStore()
    const fotoUsuario = dadosUsuario?.foto_usuario
    const temFotoPerfil = Boolean(fotoUsuario && fotoUsuario !== "none" && !fotoUsuario.endsWith("/none"))

    return (
        <div className="BoxButtomConteinerLeft">
            <div className="BoxButtomConteinerLeftIcone">
                <img
                    src={temFotoPerfil ? fotoUsuario : Perfil}
                    alt={temFotoPerfil ? "Foto de perfil do usuário" : "Perfil padrão do usuário"}
                />
            </div>
        </div>
    )
}