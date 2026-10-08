import { useUserStore } from "../../../../useUseSotore";

export async function MenuMobileEntrarNaLive(nossa_sala , nome_usuario) {
  const URLBACKEND = useUserStore.getState().urlBancoDeDados
  const dados = {
    "nossa_sala":nossa_sala,
    "nome_usuario":nome_usuario
  }
  const entrar_na_live = await fetch(`${URLBACKEND}/api/livekit/token` , {
    method:"POST",
    headers:{
        "Content-Type":"application/json"
    },
    body:JSON.stringify(dados)
  })
} 

