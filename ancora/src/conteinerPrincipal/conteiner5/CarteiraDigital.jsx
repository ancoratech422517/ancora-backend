import { useCallback, useEffect, useState } from "react"
import { fetchComAuth } from "../../utils/api"
import { useUserStore } from "../../useUseSotore"
import "./css/CarteiraDigital.css"

const formatKwanza = (value) => {
    const amount = Number(value)
    if (!Number.isFinite(amount)) return "—"
    return `${new Intl.NumberFormat("pt-AO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)} Kz`
}

const transactionStatus = (status) => {
    switch (status) {
        case "COMPLETED":
            return "Confirmado"
        case "PENDING":
            return "Aguardando pagamento"
        case "FAILED":
            return "Não concluído"
        default:
            return "Estado desconhecido"
    }
}

export default function CarteiraDigital({ onBack }) {
    const backend = useUserStore((state) => state.urlBancoDeDados)
    const user = useUserStore((state) => state.dadosUsuario)
    const [wallet, setWallet] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState("")
    const [depositOpen, setDepositOpen] = useState(false)
    const [amount, setAmount] = useState("")
    const [creatingDeposit, setCreatingDeposit] = useState(false)
    const [depositError, setDepositError] = useState("")
    const [pendingDeposit, setPendingDeposit] = useState(null)
    const [movementOpen, setMovementOpen] = useState(null)
    const [movementAmount, setMovementAmount] = useState("")
    const [movementPhone, setMovementPhone] = useState("")
    const [movementLoading, setMovementLoading] = useState(false)
    const [movementError, setMovementError] = useState("")
    const [movementResult, setMovementResult] = useState(null)

    const loadWallet = useCallback(async () => {
        setLoading(true)
        setLoadError("")
        try {
            const response = await fetchComAuth(`${backend}/api/wallet`, {
                offlineQueue: false,
            })
            const data = await response.json()
            if (!response.ok) {
                throw new Error(data?.error || "Não foi possível carregar a carteira.")
            }
            setWallet(data)
        } catch (error) {
            console.error("Erro ao carregar a carteira:", error)
            setLoadError(error instanceof Error ? error.message : "Não foi possível carregar a carteira.")
        } finally {
            setLoading(false)
        }
    }, [backend])

    useEffect(() => {
        const requestId = window.setTimeout(loadWallet, 0)
        return () => window.clearTimeout(requestId)
    }, [loadWallet])

    useEffect(() => {
        const hasPendingDeposit = wallet?.transactions?.some(
            (transaction) => transaction.status === "PENDING",
        )
        if (!hasPendingDeposit) return undefined

        const intervalId = window.setInterval(loadWallet, 15000)
        return () => window.clearInterval(intervalId)
    }, [loadWallet, wallet?.transactions])

    const createDeposit = async (event) => {
        event.preventDefault()
        setCreatingDeposit(true)
        setDepositError("")
        setPendingDeposit(null)
        try {
            const response = await fetchComAuth(`${backend}/api/wallet/deposits`, {
                method: "POST",
                offlineQueue: false,
                body: JSON.stringify({
                    amount,
                    payment_method: "multicaixa_express",
                }),
            })
            const data = await response.json()
            if (!response.ok) {
                throw new Error(data?.error || "Não foi possível iniciar o depósito.")
            }
            setPendingDeposit(data)
            setAmount("")
            await loadWallet()
            window.location.assign(data.checkout_url)
        } catch (error) {
            console.error("Erro ao iniciar depósito:", error)
            setDepositError(error instanceof Error ? error.message : "Não foi possível iniciar o depósito.")
        } finally {
            setCreatingDeposit(false)
        }
    }

    const openMovement = (type) => {
        setMovementOpen(type)
        setMovementAmount("")
        setMovementPhone("")
        setMovementError("")
        setMovementResult(null)
    }

    const submitMovement = async (event) => {
        event.preventDefault()
        setMovementLoading(true)
        setMovementError("")
        setMovementResult(null)
        try {
            const endpoint = movementOpen === "transfer" ? "transfers" : "withdrawals"
            const response = await fetchComAuth(`${backend}/api/wallet/${endpoint}`, {
                method: "POST",
                offlineQueue: false,
                body: JSON.stringify({
                    amount: movementAmount,
                    account_phone: movementPhone,
                }),
            })
            const data = await response.json()
            if (!response.ok) {
                throw new Error(data?.error || "Não foi possível processar a operação.")
            }
            setMovementResult(data)
            await loadWallet()
        } catch (error) {
            setMovementError(error instanceof Error ? error.message : "Não foi possível processar a operação.")
        } finally {
            setMovementLoading(false)
        }
    }

    const transactions = wallet?.transactions ?? []

    return (
        <main className="digital-wallet-page">
            <header className="digital-wallet-header">
                <button className="wallet-back-button" type="button" onClick={onBack}>
                    <span aria-hidden="true">←</span> Voltar ao perfil
                </button>
                <div className="wallet-brand" aria-label="Âncora Pay">
                    <span className="wallet-brand-mark">A</span>
                    <span>Âncora<span className="wallet-brand-accent">Pay</span></span>
                </div>
                <button
                    className="wallet-refresh-button"
                    type="button"
                    onClick={loadWallet}
                    disabled={loading}
                >
                    {loading ? "A atualizar…" : "Atualizar"}
                </button>
            </header>

            <div className="digital-wallet-content">
                <section className="wallet-welcome">
                    <div>
                        <p className="wallet-eyebrow">CARTEIRA DIGITAL · AOA</p>
                        <h1>Olá, {user?.nome || "utilizador"}</h1>
                        <p>O saldo é atualizado após a confirmação segura de cada pagamento.</p>
                    </div>
                    <span className="wallet-secure-badge"><span aria-hidden="true">●</span> Conta protegida</span>
                </section>

                {loadError && (
                    <div className="wallet-error" role="alert">
                        {loadError}
                        <button type="button" onClick={loadWallet}>Tentar novamente</button>
                    </div>
                )}

                <section className="wallet-overview" aria-label="Resumo da carteira">
                    <article className="wallet-balance-card">
                        <div className="wallet-balance-card-top">
                            <span>Saldo disponível</span>
                            <span className="wallet-currency-pill">AOA</span>
                        </div>
                        <strong>{loading && !wallet ? "A carregar…" : formatKwanza(wallet?.balance)}</strong>
                        <p>Disponível após confirmação pela DizanPay</p>
                        <div className="wallet-card-orb" aria-hidden="true" />
                    </article>
                    <article className="wallet-metric-card">
                        <span>Entradas confirmadas</span>
                        <strong>{loading && !wallet ? "A carregar…" : formatKwanza(wallet?.total_incoming)}</strong>
                        <small>Depósitos liquidados</small>
                    </article>
                    <article className="wallet-metric-card">
                        <span>Saídas</span>
                        <strong>{formatKwanza(wallet?.total_outgoing ?? "0.00")}</strong>
                        <small>Levantamentos e transferências</small>
                    </article>
                </section>

                <section className="wallet-actions" aria-label="Ações da carteira">
                    <button className="wallet-action-primary" type="button" onClick={() => setDepositOpen(true)}>
                        <span aria-hidden="true">↓</span>
                        <span>Depositar</span>
                    </button>
                    <button type="button" onClick={() => openMovement("withdrawal")}>
                        <span aria-hidden="true">↑</span>
                        <span>Levantar</span>
                    </button>
                    <button type="button" onClick={() => openMovement("transfer")}>
                        <span aria-hidden="true">⇄</span>
                        <span>Transferir</span>
                    </button>
                    <p>O saldo e o extrato refletem apenas movimentos confirmados pelo servidor.</p>
                </section>

                <section className="wallet-activity">
                    <div className="wallet-section-heading">
                        <div>
                            <p className="wallet-eyebrow">MOVIMENTOS DA CONTA</p>
                            <h2>Atividade recente</h2>
                        </div>
                        <span>{transactions.length} movimento(s)</span>
                    </div>

                    {loading && !wallet ? (
                        <p className="wallet-empty-state">A carregar movimentos…</p>
                    ) : transactions.length === 0 ? (
                        <div className="wallet-empty-state">
                            <span className="wallet-empty-icon" aria-hidden="true">↗</span>
                            <strong>Ainda não há movimentos</strong>
                            <p>Quando um depósito for confirmado, aparecerá aqui.</p>
                        </div>
                    ) : (
                        <div className="wallet-transaction-list">
                            {transactions.map((transaction) => (
                                <article className="wallet-transaction" key={transaction.reference_id}>
                                    <span className="wallet-transaction-icon" aria-hidden="true">↓</span>
                                    <div className="wallet-transaction-description">
                                        <strong>
                                            {transaction.movement_type === "TRANSFER"
                                                ? (transaction.direction === "IN" ? "Transferência recebida" : "Transferência enviada")
                                                : transaction.movement_type === "WITHDRAWAL"
                                                    ? "Levantar para Multicaixa Express"
                                                    : "Depósito Multicaixa Express"}
                                        </strong>
                                        <span>{transaction.reference_id}</span>
                                        <time dateTime={transaction.created_at}>
                                            {new Date(transaction.created_at).toLocaleString("pt-AO")}
                                        </time>
                                    </div>
                                    <span className={`wallet-transaction-status wallet-status-${transaction.status.toLowerCase()}`}>
                                        {transactionStatus(transaction.status)}
                                    </span>
                                    <strong className="wallet-transaction-amount">
                                        {transaction.direction === "OUT" || transaction.movement_type === "WITHDRAWAL" || transaction.movement_type === "TRANSFER"
                                            ? `${transaction.direction === "IN" ? "+" : "-"} ${formatKwanza(transaction.amount)}`
                                            : `+ ${formatKwanza(transaction.amount)}`}
                                    </strong>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {depositOpen && (
                <div className="wallet-dialog-backdrop" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setDepositOpen(false)
                }}>
                    <section
                        className="wallet-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="wallet-deposit-title"
                    >
                        <div className="wallet-dialog-heading">
                            <div>
                                <p className="wallet-eyebrow">MULTICAIXA EXPRESS</p>
                                <h2 id="wallet-deposit-title">Adicionar saldo</h2>
                            </div>
                            <button type="button" onClick={() => setDepositOpen(false)} aria-label="Fechar">
                                ×
                            </button>
                        </div>
                        <p className="wallet-dialog-copy">
                            O saldo só muda depois da confirmação segura da DizanPay. Abra o checkout para concluir o pagamento.
                        </p>
                        {pendingDeposit ? (
                            <div className="wallet-pending-confirmation" role="status">
                                <strong>Pedido de depósito criado</strong>
                                <span>Referência: {pendingDeposit.reference_id}</span>
                                <span>Valor: {formatKwanza(pendingDeposit.amount)}</span>
                                <span>Estado: Aguardando pagamento</span>
                                <span>Confirme o pedido na aplicação Multicaixa Express.</span>
                                {pendingDeposit.checkout_url && (
                                    <a
                                        href={pendingDeposit.checkout_url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Continuar para o pagamento DizanPay
                                    </a>
                                )}
                            </div>
                        ) : (
                            <form className="wallet-deposit-form" onSubmit={createDeposit}>
                                <label htmlFor="wallet-deposit-amount">Valor (Kz)</label>
                                <input
                                    id="wallet-deposit-amount"
                                    type="number"
                                    min="100"
                                    max="1000000000000"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value)}
                                    placeholder="Ex.: 10 000"
                                    required
                                />
                                <label htmlFor="wallet-deposit-method">Método</label>
                                <select id="wallet-deposit-method" value="multicaixa_express" disabled>
                                    <option value="multicaixa_express">Multicaixa Express</option>
                                </select>
                                {depositError && <p className="wallet-error-message" role="alert">{depositError}</p>}
                                <button type="submit" disabled={creatingDeposit}>
                                    {creatingDeposit ? "A criar pedido…" : "Continuar"}
                                </button>
                            </form>
                        )}
                    </section>
                </div>
            )}

            {movementOpen && (
                <div className="wallet-dialog-backdrop" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setMovementOpen(null)
                }}>
                    <section className="wallet-dialog" role="dialog" aria-modal="true" aria-labelledby="wallet-movement-title">
                        <div className="wallet-dialog-heading">
                            <div>
                                <p className="wallet-eyebrow">
                                    {movementOpen === "transfer" ? "TRANSFERÊNCIA ENTRE CONTAS" : "LEVANTAMENTO MULTICAIXA EXPRESS"}
                                </p>
                                <h2 id="wallet-movement-title">
                                    {movementOpen === "transfer" ? "Transferir saldo" : "Levantar saldo"}
                                </h2>
                            </div>
                            <button type="button" onClick={() => setMovementOpen(null)} aria-label="Fechar">×</button>
                        </div>
                        {movementResult ? (
                            <div className="wallet-pending-confirmation" role="status">
                                <strong>{movementOpen === "transfer" ? "Transferência concluída" : "Pedido de levantamento criado"}</strong>
                                <span>Referência: {movementResult.reference_id}</span>
                                <span>Valor: {formatKwanza(movementResult.amount)}</span>
                                <span>Estado: {movementResult.status}</span>
                            </div>
                        ) : (
                            <form className="wallet-deposit-form" onSubmit={submitMovement}>
                                <label htmlFor="wallet-movement-phone">Número associado ao Multicaixa Express</label>
                                <input
                                    id="wallet-movement-phone"
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]{9}"
                                    maxLength="9"
                                    value={movementPhone}
                                    onChange={(event) => setMovementPhone(event.target.value.replace(/\D/g, ""))}
                                    placeholder="923 000 000"
                                    required
                                />
                                <label htmlFor="wallet-movement-amount">Valor (Kz)</label>
                                <input
                                    id="wallet-movement-amount"
                                    type="number"
                                    min="100"
                                    max="1000000000000"
                                    step="1"
                                    value={movementAmount}
                                    onChange={(event) => setMovementAmount(event.target.value)}
                                    required
                                />
                                {movementError && <p className="wallet-error-message" role="alert">{movementError}</p>}
                                <button type="submit" disabled={movementLoading}>
                                    {movementLoading ? "A processar…" : movementOpen === "transfer" ? "Confirmar transferência" : "Solicitar levantamento"}
                                </button>
                            </form>
                        )}
                    </section>
                </div>
            )}
        </main>
    )
}
