import { useUserStore } from "../../../useUseSotore"
export async function Login(ativarConteiner, setDados , setEstadoLoading , setErro) { 
    setEstadoLoading("True")
    setErro("False")
    const URL_BACKEND_ANCORA = useUserStore.getState().urlBancoDeDados
    const telefone = document.getElementById("TerminalLogin").value 
    const senha = document.getElementById("SenhaLogin").value
    
    if (!telefone || !senha) {
        console.log("preencha o campo da foto")
        return
    }
    
    const dados = { telefone, senha }

    try {
        const logar = await fetch(`${URL_BACKEND_ANCORA}/Login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include", // CRÍTICO: recebe e guarda o cookie HttpOnly
            body: JSON.stringify(dados)
        })
        
        const get_response_logar = await logar.json()
        
        if (!logar.ok || get_response_logar.status === "False") {

            setEstadoLoading("False")
            setErro("True")
            return
        }
        
        // REMOVIDO: localStorage.setItem("token_sessao", get_response_logar.token)
        // O cookie já foi setado pelo backend. JS não vê o token.
        console.log("Login OK. Cookie setado pelo servidor")
        setEstadoLoading("False")
        
        if (setDados) {
            setDados(get_response_logar) // vem só: id, nome, telefone
        }
        
        if (ativarConteiner) {
            ativarConteiner("conteiner1") // Muda a tela no App.jsx
        }
        
    } catch (err) {
        console.error("Erro de conexão:", err)
        alert("Erro de conexão com servidor",err)
        setEstadoLoading("False")
    }
}


   export function SwitchTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));

            if (tab === 'login') {
                document.querySelectorAll('.tab')[0].classList.add('active');
                document.getElementById('login-form').classList.add('active');
            } else {
                document.querySelectorAll('.tab')[1].classList.add('active');
                document.getElementById('register-form').classList.add('active');
                Photo()
            }
        }

        // Preview da foto de perfil
       
 function Photo (){
           document.getElementById('avatar-input').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('avatar-preview');
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                }
                reader.readAsDataURL(file);
            }
        });

        // Máscara para telefone
// document.getElementById('register-phone').addEventListener('input', function(e) {
//     let value = e.target.value.replace(/\D/g, ''); // Remove letras/símbolos
    
//     if (value.length > 12) value = value.slice(0, 12); // Limita a 12 dígitos

//     // Aplica a formatação em tempo real
//     if (value.length > 9) {
//         // Formata o último bloco: (244) 9XX-XXX-XXX
//         value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,3})/, '($1) $2-$3-$4');
//     } else if (value.length > 6) {
//         // Formata o segundo bloco: (244) 9XX-XXX
//         value = value.replace(/^(\d{3})(\d{3})(\d{0,3})/, '($1) $2-$3');
//     } else if (value.length > 3) {
//         // Formata o primeiro bloco após o código do país: (244) 9XX
//         value = value.replace(/^(\d{3})(\d{0,3})/, '($1) $2');
//     } else if (value.length > 0) {
//         // Enquanto digita o código do país: (24
//         value = value.replace(/^(\d*)/, '($1');
//     }

//     e.target.value = value;
// });
        // // Define data máxima como hoje - 13 anos
        // const birthInput = document.getElementById('register-birth');
        // const today = new Date();
        // const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
        // birthInput.max = maxDate.toISOString().split('T')[0];

        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
            });
        });
 }