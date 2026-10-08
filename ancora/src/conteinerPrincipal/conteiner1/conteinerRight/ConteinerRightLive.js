import { useUserStore } from "../../../useUseSotore";

const Socket = useUserStore.getState().socket;
const dadosUser = useUserStore.getState().dadosUsuario

export function Conteiner_Chamada_Grupo(sala) {
    try{
        Socket.emit('chamada_grupo', { "sala": sala, "id_remitente":dadosUser.id});
        alert("emitido chamada_grupo para a sala: " + sala);
    }
    catch(erro){
        alert("este é o erro avelino:" , erro)
    }
    
}













