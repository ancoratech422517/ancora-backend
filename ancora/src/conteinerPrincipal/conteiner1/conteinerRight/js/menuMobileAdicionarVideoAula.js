import axios from 'axios';
import { useUserStore } from "../../../../useUseSotore";

export async function MenuMobileAdicionarVideoAula(nome_turma, id_admin_turma, setProgresso, setEstadoProgresso, setTextoProgresso, setOutroSvg, setEstadoConteinerAdicionarVideo) {
    const URLBACKEND = useUserStore.getState().urlBancoDeDados;
    const mySocket = useUserStore.getState().socket;
    const tema_video = document.getElementById("tema_video").value;
    const inputVideo = document.getElementById("video");
    
    // Configurações do seu Cloudinary
    const CLOUD_NAME = "dxvnntal1"; 
    const UPLOAD_PRESET = "minha_turma_preset"; // O nome que criaste no painel

    if (tema_video.trim() === "" || !inputVideo.files || inputVideo.files.length === 0) {
        alert("Preencha o tema e selecione um vídeo.");
        return;
    }

    const arquivo = inputVideo.files[0];

    try {
        setEstadoProgresso(true);
        setTextoProgresso("Enviando vídeo...");

        // 1. Preparar dados para o Cloudinary (Unsigned)
        const formData = new FormData();
        formData.append("file", arquivo);
        formData.append("upload_preset", UPLOAD_PRESET);
        formData.append("resource_type", "video");

        // 2. Upload direto para o Cloudinary
        const cloudinaryResponse = await axios.post(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
            formData,
            {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgresso(percentCompleted);
                }
            }
        );

        const videoUrl = cloudinaryResponse.data.secure_url;

        // 3. Registrar apenas a URL no seu backend
        setTextoProgresso("Registrando aula...");
        await axios.post(`${URLBACKEND}/registrar_aula`, {
            nome_turma,
            id_admin_turma,
            tema_video,
            video_url: videoUrl
        });

        // 4. Finalização visual
        setTextoProgresso("Aula adicionada com sucesso!");
        setOutroSvg(true);
        
        // Notifica via socket
        mySocket.emit("buscar_nova_aula", { nome_turma, id_admin_turma });

        setTimeout(() => {
            setEstadoProgresso(false);
            setOutroSvg(false);
            setEstadoConteinerAdicionarVideo(false);
            setProgresso(0);
            setTextoProgresso("Aguarde...");
        }, 2000);

    } catch (error) {
        console.error("Erro no fluxo de upload:", error);
        const mensagemErro = error.response?.data?.error?.message || "Erro de conexão";
        alert("Falha no envio: " + mensagemErro);
        setEstadoProgresso(false);
    }
}