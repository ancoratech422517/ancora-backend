export function Search () {
const input_search = document.querySelector("input[type='search']");
const lista_usuarios = document.querySelectorAll(".ConteinerRightMenuMobileTurmaBox2MenuAdminTurmaConteinerAddAlunoScrollDados");

if (input_search !== ""){
input_search.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase();

    lista_usuarios.forEach((usuario) => {
        // Busca o nome dentro do elemento (ajuste o seletor se necessário)
        const nomeUsuario = usuario.querySelector(".ConteinerRightMenuMobileTurmaBox2MenuAdminTurmaConteinerAddAlunoScrollDadosCont li").textContent.toLowerCase();
        const telefone_usuario = usuario.querySelector(".ConteinerRightMenuMobileTurmaBox2MenuAdminTurmaConteinerAddAlunoScrollDadosCont b").textContent.toLowerCase();

        if (nomeUsuario.includes(termo)) {
            usuario.style.display = ""; // Mostra o elemento
        } 
        else if(telefone_usuario.includes(termo)){
            usuario.style.display = ""; // Mostra o elemento
        }
        else {
            usuario.style.display = "none"; // Esconde o elemento
        }
    });
});

}

}
