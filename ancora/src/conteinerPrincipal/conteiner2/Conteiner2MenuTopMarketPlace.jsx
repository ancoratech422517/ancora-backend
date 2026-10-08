import "./css/Conteiner2MenuTopMarketPlace.css"
import { ClicarButtonMarketPLaceMenuTop } from "./js/Conteiner2MeuTopMarketPlaceAction";
import { useUserStore } from "../../useUseSotore";
export default function Conteiner2MenuTopMarketPlace ({pesquisaProduto, setPesquisaProduto}) {
    const {setEstadoMenu , estadoMenu} = useUserStore()
    return (
        <div className="Conteiner2MenuTopMarketPlace">
            <div className="Conteiner2MenuTopMarketPlaceBox1">
                <h2>Ancora</h2>
                <li onClick={()=> estadoMenu == "none" ? setEstadoMenu("ativar") : setEstadoMenu("none") }>
                    Shop
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </li>
                <li>Brands</li>
                <li>Deals</li>
            </div>
            <div className="Conteiner2MenuTopMarketPLaceBox3">
                <svg class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--gray-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>

                <input
                    type="search"
                    placeholder="Pesquisar produtos, categorias ou vendedores"
                    aria-label="Pesquisar produtos por nome, categoria ou vendedor"
                    value={pesquisaProduto}
                    onChange={(evento) => setPesquisaProduto(evento.target.value)}
                />
            </div>
            <div className="Conteiner2MenuTopMarketPlaceBox2">

                <li onClick={ClicarButtonMarketPLaceMenuTop}>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    Vendedor
                </li>
                <li onClick={ClicarButtonMarketPLaceMenuTop}>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </li>
            </div>
            <div className="Conteiner2MenuTopMarketPlaceBox2IconeMenu">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-justify" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>
                </svg>
            </div>  
        </div>
    )
}