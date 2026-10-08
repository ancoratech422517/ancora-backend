import { useRef, useState } from "react";
import "../css/GeralChatEstadoViewDATEAudio.css"
import { useUserStore } from "../../../../../useUseSotore";
export default function GeraChatEstadoViewDATEAudio (){
    const {setMostrarConteinerEstadoUserViews, DadosEstadoElementoClicado , DadosGeralEstadoUser , dadosUsuario} = useUserStore()
    const audioRef = useRef(null)
    const [estaTocando, setEstaTocando] = useState(false)

    const alternarReproducao = async () => {
        const audio = audioRef.current
        if (!audio) return

        if (audio.paused) {
            try {
                audioRef.current.playbackRate = 1.5;
                await audio.play()
            } catch (erro) {
                console.error("Erro ao reproduzir a música do estado:", erro)
            }
        } else {
            audio.pause()
        }
    }

    return (
        <div className="GeralChatEstadoViewDateAudioBox">
            <section id="c7">
                <div className="st">
                    <div className={estaTocando ? "pl on" : "pl"}>
                        <audio
                            ref={audioRef}
                            src={DadosEstadoElementoClicado || undefined}
                            preload="metadata"
                            onPlay={() => setEstaTocando(true)}
                            onPause={() => setEstaTocando(false)}
                            onEnded={() => setEstaTocando(false)}
                        />
                        <div className="vinyl"></div>
                        <button
                            className="btn"
                            type="button"
                            aria-label={estaTocando ? "Pausar música" : "Tocar música"}
                            onClick={alternarReproducao}
                            disabled={!DadosEstadoElementoClicado}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-music-note-beamed" viewBox="0 0 16 16">
                            <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/>
                            <path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/>
                            <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/>
                            </svg>
                        </button>

                    </div>
                </div>
                <pre data-css></pre>

            </section>
           
            <div className="GeralChatEstadoViewDateAudioBoxDadosPerfil">
                <div className="GeralChatEstadoViewDateAudioBoxDadosPerfilBox1">
                    <div className="GeralChatEstadoViewDateAudioBoxDadosPerfilBox1FotoUser">
                        <img src={dadosUsuario.foto_usuario} alt="" />
                    </div>
                    <div className="GeralChatEstadoViewDateAudioBoxDadosPerfilBox1Conteudo">
                        <h2>{dadosUsuario.nome}</h2>
                        <li>Âncora Soung</li>
                    </div>
                </div>
                <div className="GeralChatEstadoViewDateAudioBoxDadosPerfilBox2">
                    <li>
                       {DadosGeralEstadoUser.descricao_dados}
                    </li>
                </div>
            </div>
            <div className="GeralChatEstadoViewDateAudioBoxBUTOON" onClick={()=>{setMostrarConteinerEstadoUserViews(false)}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
                </svg>
            </div>
            <div className="GeralChatEstadoViewDateAudioBoxReacao">
                <div className="GeralChatEstadoViewDateAudioBoxReacaoBox">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-repeat" viewBox="0 0 16 16">
                    <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z"/>
                    </svg>
                </div>
                <div className="GeralChatEstadoViewDateAudioBoxReacaoBox">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-fill" viewBox="0 0 16 16">
                        <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                        <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                    </svg>
                </div>
                <div className="GeralChatEstadoViewDateAudioBoxReacaoBox">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-heart-fill" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
                    </svg>
                </div>
                {/* <div className="GeralChatEstadoViewDateAudioBoxReacaoBox"></div> */}
            </div>

        </div>
    )
}