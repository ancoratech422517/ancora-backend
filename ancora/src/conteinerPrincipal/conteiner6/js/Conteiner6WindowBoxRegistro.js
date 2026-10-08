import { useUserStore } from "../../../useUseSotore"
import { SwitchTab } from "./Conteiner6WindowBoxLogin";

async function obterLocalizacaoExata() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.error("❌ Geolocalização não suportada");
            return resolve(null);
        }

        console.log("📍 Pedindo permissão de localização...");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    console.log(`✅ Coordenadas obtidas: ${lat}, ${lon}`);

                    // === IMPORTANTE: Adicionar User-Agent (Nominatim exige) ===
                    const resposta = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
                        {
                            headers: {
                                'User-Agent': 'MeuAppRegistro/1.0 (contacto@meuemail.com)'
                            }
                        }
                    );

                    if (!resposta.ok) {
                        console.error("❌ Erro na API Nominatim:", resposta.status);
                        return resolve(null);
                    }

                    const dados = await resposta.json();
                    console.log("📦 Dados brutos da API:", dados);

                    const address = dados.address || {};
                    console.log("🏠 Address extraído:", address);

                    const localizacao = {
                        continente: address.continent || "Não encontrado",
                        pais: address.country || "Não encontrado",
                        provincia: address.state || address.region || address.county || "Não encontrado",
                        capital: address.city || address.town || address.municipality || "Não encontrado",
                        bairro: address.neighbourhood || address.suburb || address.quarter || "Não encontrado"
                    };

                    console.log("✅ Localização final:", localizacao);
                    resolve(localizacao);

                } catch (erro) {
                    console.error("❌ Erro ao processar localização:", erro);
                    resolve(null);
                }
            },
            (erro) => {
                console.warn("⚠️ Erro na geolocalização:", erro.message);
                resolve(null);
            },
            { 
                enableHighAccuracy: true, 
                timeout: 15000, 
                maximumAge: 0 
            }
        );
    });
}

export async function Registro(setEstadoLoading) {
    setEstadoLoading("True");

    const URL_BACKEND_ANCORA = useUserStore.getState().urlBancoDeDados;

    const nome = document.getElementById("register-name").value;
    const telefone = document.getElementById("register-phone").value;
    const senha = document.getElementById("register-password").value;
    const confirmar_senha = document.getElementById("register-confirm").value;
    const data_nascimento = document.getElementById("register-birth").value;
    const email = document.getElementById("register-email").value;
    const foto = document.getElementById("avatar-input");

    
    const telefone_limpo = telefone.replace(/\D/g, '');

    const form__data = new FormData();

    if (foto && foto.files.length > 0) {
        form__data.append("foto", foto.files[0]);
    }

    form__data.append("nome", nome);
    form__data.append("telefone", telefone_limpo);
    form__data.append("senha", senha);
    form__data.append("confirmar_senha", confirmar_senha);
    form__data.append("data_nascimento", data_nascimento);
    form__data.append("email", email);

    // ==================== LOCALIZAÇÃO ====================
    console.log("🔄 Iniciando obtenção de localização...");
    const dadosLocalizacao = await obterLocalizacaoExata();

    if (dadosLocalizacao) {
        form__data.append("continente", dadosLocalizacao.continente);
        form__data.append("pais", dadosLocalizacao.pais);
        form__data.append("provincia", dadosLocalizacao.provincia);
        form__data.append("capital", dadosLocalizacao.capital);
        form__data.append("bairro", dadosLocalizacao.bairro);
        form__data.append("localizacao_completa", JSON.stringify(dadosLocalizacao));
        
        console.log("✅ Dados de localização adicionados ao FormData");
    } else {
        console.warn("⚠️ Localização não obtida - enviando erro");
        form__data.append("localizacao_erro", "Não foi possível obter localização");
    }
    // ====================================================

    try {
        console.log("🚀 Enviando formulário para o backend...");
        const resposta = await fetch(`${URL_BACKEND_ANCORA}/api/Registrar`, {
            method: "POST",
            body: form__data
        });

        const resultado = await resposta.json();
        console.log("📨 Resposta do servidor:", resultado);

        if (resultado.status) {
            console.log("🎉 Registro bem sucedido!");
            setEstadoLoading("False");
            SwitchTab("login");
        } else {
            console.error("❌ Falha no registro:", resultado);
            setEstadoLoading("False");
        }

    } catch (err) {
        console.error("💥 Erro na requisição:", err);
        setEstadoLoading("False");
    }
}