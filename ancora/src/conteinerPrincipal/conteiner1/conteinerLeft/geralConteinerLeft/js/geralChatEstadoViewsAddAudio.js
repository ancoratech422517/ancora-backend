import { useUserStore } from "../../../../../useUseSotore";

export function GeralChatEstadoViewsAddAudio () {

    try{
        let my_audio = useUserStore.getState().DadosEstadoElementoClicado
        let SRC=my_audio



        if(SRC){
           
            document.querySelectorAll('audio').forEach(a=>a.src=SRC);
        
                       
            document.addEventListener('play',e=>document.querySelectorAll('audio').forEach(o=>o!==e.target&&o.pause()),true);
            document.querySelectorAll('.btn').forEach(b=>b.setAttribute('aria-label','Tocar ou pausar'));
            document.querySelectorAll('.bar').forEach(b=>b.setAttribute('aria-label','Posição da música'));
            document.querySelectorAll('.eq').forEach(e=>{e.innerHTML='<i></i>'.repeat(16);[...e.children].forEach(i=>i.style.setProperty('--d',(.45+Math.random()*.6)+'s'))});
            document.querySelectorAll('.pl').forEach(pl => {
            const a   = pl.querySelector('audio');
            const btn = pl.querySelector('.btn');
            const bar = pl.querySelector('.bar');   // opcional
          
            

            btn.onclick = () => a.paused ? a.play() : a.pause();
            a.onplay    = () => pl.classList.add('on');
            a.onpause   = () => pl.classList.remove('on');
            
            a.ontimeupdate = () => {
                const p = a.currentTime / a.duration || 0;
                pl.style.setProperty('--p', p * 100 + '%');   // o CSS lê --p
                if (bar) bar.value = p * 1000;
            };
           
            if (bar) bar.oninput = () => a.currentTime = bar.value / 1000 * a.duration;
            
            });

        }
        else{
            alert("erro ao reproduzir a musica avelino")
        }

    }
    catch(erro){
        alert("ouve um erro avelino:" , erro)
    }

}