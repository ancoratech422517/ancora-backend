import { useState } from "react";

export default function Conteiner2RightWindowProdutoCardComentarioUsuario (){
    return (
            <div className="ConteinerRightWindowProdutosScrollComentarioConteinerBox">
                    <div className="ConteinerRightWindowProdutosScrollComentarioConteinerBoxIconeDados">
                        <div className="ConteinerRightWindowProdutosScrollComentarioConteinerBoxIconeDadosIcone">
                            <div className="ConteinerRightWindowProdutosScrollComentarioConteinerBoxIconeDadosIconeFoto"></div>
                        </div>
                        <div className="ConteinerRightWindowProdutosScrollComentarioConteinerBoxIconeDadosCont">
                            <b>Cláudio Avelino</b>
                            <div className="ConteinerRightWindowProdutosScrollComentarioConteinerBoxIconeDadosContDados">
                                <li>Avaliação</li>
                                <b>★★★★★</b>
                            </div>
                        </div>
                    </div>
                    <div className="ConteinerRightWindowProdutosScrollComentarioConteinerBoxComentarioUser">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. 
                        Tempora nulla expedita, commodi voluptate quidem labore 
                        reiciendis iure rem vel consequuntur veniam maiores laboriosam 
                        necessitatibus quas cumque obcaecati quos, officia esse. 
                        <div className="divUser">
                            <b>este comentario foi util para voce?</b>
                            <div className="divBntsUtil">
                                <button>👍(36)</button>
                                <button>👎(0)</button>
                            </div>
                        </div>
                    </div>
                </div>

    )
}