import { useCallback, useEffect, useMemo, useState } from "react"
import { useUserStore } from "../../useUseSotore"
import { fetchJsonComAuth } from "../../utils/api"
import "./ancoraAcademy.css"

const NAV_ITEMS = {
  teacher: [
    { id: "overview", label: "Painel" },
    { id: "classes", label: "Turmas" },
    { id: "lessons", label: "Aulas" },
    { id: "schedule", label: "Agenda" },
    { id: "students", label: "Alunos" },
  ],
  student: [
    { id: "overview", label: "Início" },
    { id: "classes", label: "Minhas turmas" },
    { id: "lessons", label: "Aulas" },
    { id: "schedule", label: "Calendário" },
  ],
}

const EMPTY_ACADEMY = {
  profile: { name: "" },
  roles: { student: false, teacher: false },
  classes: { student: [], teacher: [] },
  schedules: [],
  lessons: [],
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || "Data por definir"
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function AcademyIcon({ name }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    classes: <><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H20v16H5.5A2.5 2.5 0 0 0 3 21z" /><path d="M3 5.5v13A2.5 2.5 0 0 1 5.5 16H20M8 7h8" /></>,
    lessons: <><path d="m9 6 10 6-10 6z" /><circle cx="12" cy="12" r="9" /></>,
    schedule: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    students: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export default function AncoraAcademy() {
  const { dadosUsuario, setAtivar, urlBancoDeDados } = useUserStore()
  const [academy, setAcademy] = useState(EMPTY_ACADEMY)
  const [role, setRole] = useState("student")
  const [section, setSection] = useState("overview")
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const fetchAcademyData = useCallback(async () => {
    const { response, data: result } = await fetchJsonComAuth(`${urlBancoDeDados}/api/academy`)
    if (!response.ok) {
      throw new Error(result.error || "Não foi possível carregar a Âncora Academy.")
    }
    return result
  }, [urlBancoDeDados])

  const loadAcademy = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchAcademyData()
      setAcademy(result)
      setRole(result.roles?.teacher ? "teacher" : "student")
      setError("")
    } catch (loadError) {
      setError(loadError.message || "Não foi possível carregar a Âncora Academy.")
    } finally {
      setLoading(false)
    }
  }, [fetchAcademyData])

  useEffect(() => {
    let active = true
    fetchAcademyData()
      .then((result) => {
        if (!active) return
        setAcademy(result)
        setRole(result.roles?.teacher ? "teacher" : "student")
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Não foi possível carregar a Âncora Academy.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [fetchAcademyData])

  const classes = useMemo(() => academy.classes?.[role] ?? [], [academy.classes, role])
  const navItems = NAV_ITEMS[role]
  const classIds = useMemo(() => new Set(classes.map((item) => item.id)), [classes])
  const lessons = (academy.lessons || []).filter((item) => classIds.has(item.class_id))
  const schedules = (academy.schedules || []).filter((item) =>
    classes.some((classItem) => classItem.admin_id === item.teacher_id && classItem.room === item.room),
  )
  const studentCount = classes.reduce((total, item) => total + (item.student_count || 0), 0)
  const upcomingSchedules = schedules.filter((item) => item.is_upcoming)

  const openForm = (type) => {
    setNotice("")
    setError("")
    setForm(type)
  }

  const submitForm = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const body = Object.fromEntries(formData.entries())
    const endpoint = {
      class: "/api/academy/classes",
      schedule: "/api/academy/schedules",
      lesson: "/api/academy/lessons",
    }[form]
    if (form === "schedule" || form === "lesson") body.class_id = Number(body.class_id)
    setSaving(true)
    setError("")
    try {
      const { response, data: result } = await fetchJsonComAuth(`${urlBancoDeDados}${endpoint}`, {
        method: "POST",
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível guardar os dados.")
      }
      setForm(null)
      setNotice("Alterações guardadas e sincronizadas.")
      await loadAcademy()
    } catch (saveError) {
      setError(saveError.message || "Não foi possível guardar os dados.")
    } finally {
      setSaving(false)
    }
  }

  const renderForm = () => {
    if (!form) return null
    const isClass = form === "class"
    const isSchedule = form === "schedule"
    const heading = isClass ? "Criar nova turma" : isSchedule ? "Agendar uma aula" : "Registar uma aula"
    return (
      <div className="academy-dialog-backdrop">
        <form className="academy-dialog" onSubmit={submitForm} aria-labelledby="academy-dialog-title">
          <div className="academy-dialog-heading">
            <div>
              <span className="academy-eyebrow">ÂNCORA ACADEMY</span>
              <h2 id="academy-dialog-title">{heading}</h2>
            </div>
            <button type="button" className="academy-icon-button" onClick={() => setForm(null)} aria-label="Fechar formulário">×</button>
          </div>
          {isClass ? (
            <label className="academy-field">
              Nome da turma
              <input name="name" maxLength="120" placeholder="Ex.: Matemática - 10.ª classe" required autoFocus />
            </label>
          ) : (
            <>
              <label className="academy-field">
                Turma
                <select name="class_id" required defaultValue="">
                  <option value="" disabled>Escolha uma turma</option>
                  {(academy.classes?.teacher || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="academy-field">
                {isSchedule ? "Título da sessão" : "Título da aula"}
                <input name="title" maxLength="120" placeholder={isSchedule ? "Ex.: Revisão do módulo 1" : "Ex.: Introdução ao tema"} required />
              </label>
              {isSchedule ? (
                <label className="academy-field">
                  Data e hora
                  <input name="starts_at" type="datetime-local" required />
                </label>
              ) : (
                <label className="academy-field">
                  URL do vídeo
                  <input name="video_url" type="url" placeholder="https://..." required />
                </label>
              )}
            </>
          )}
          {error && <p className="academy-inline-error" role="alert">{error}</p>}
          <div className="academy-dialog-actions">
            <button type="button" className="academy-button academy-button-secondary" onClick={() => setForm(null)}>Cancelar</button>
            <button type="submit" className="academy-button academy-button-primary" disabled={saving}>
              {saving ? "A guardar..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    )
  }

  const renderOverview = () => (
    <>
      <div className="academy-stat-grid">
        <article className="academy-stat-card"><span>Turmas</span><strong>{classes.length}</strong><small>{role === "teacher" ? "Sob a sua gestão" : "Em que está inscrito"}</small></article>
        <article className="academy-stat-card"><span>{role === "teacher" ? "Alunos" : "Aulas disponíveis"}</span><strong>{role === "teacher" ? studentCount : lessons.length}</strong><small>{role === "teacher" ? "Inscritos nas suas turmas" : "Conteúdos das suas turmas"}</small></article>
        <article className="academy-stat-card"><span>Próximas sessões</span><strong>{upcomingSchedules.length}</strong><small>Agendadas para as suas turmas</small></article>
      </div>
      <div className="academy-dashboard-grid">
        <section className="academy-panel academy-chart-panel">
          <div className="academy-panel-title">
            <div><span className="academy-eyebrow">{role === "teacher" ? "ACOMPANHAMENTO" : "CONTEÚDO"}</span><h2>{role === "teacher" ? "Alunos por turma" : "Aulas por turma"}</h2></div>
            <span className="academy-live-dot" />
          </div>
          {classes.length ? (
            <div className="academy-bars" role="img" aria-label={role === "teacher" ? "Número de alunos por turma" : "Número de aulas por turma"}>
              {classes.map((item) => {
                const value = role === "teacher" ? item.student_count : lessons.filter((lesson) => lesson.class_id === item.id).length
                const maximum = Math.max(1, ...classes.map((entry) => role === "teacher" ? entry.student_count : lessons.filter((lesson) => lesson.class_id === entry.id).length))
                return (
                  <div className="academy-bar-row" key={item.id}>
                    <span title={item.name}>{item.name}</span>
                    <div className="academy-bar-track"><i style={{ width: `${Math.max(4, value / maximum * 100)}%` }} /></div>
                    <b>{value}</b>
                  </div>
                )
              })}
            </div>
          ) : <p className="academy-empty-copy">As turmas e os respetivos indicadores aparecerão aqui.</p>}
        </section>
        <section className="academy-panel academy-next-panel">
          <div className="academy-panel-title"><div><span className="academy-eyebrow">AGENDA</span><h2>Próximas aulas</h2></div><AcademyIcon name="schedule" /></div>
          {upcomingSchedules.length ? upcomingSchedules.slice(0, 4).map((item) => (
            <article className="academy-upcoming-item" key={item.id}>
              <span className="academy-date-mark"><b>{new Date(item.starts_at).getDate()}</b><small>{new Intl.DateTimeFormat("pt-PT", { month: "short" }).format(new Date(item.starts_at))}</small></span>
              <div><strong>{item.title}</strong><small>{item.class_name} · {formatDate(item.starts_at)}</small></div>
            </article>
          )) : <p className="academy-empty-copy">Ainda não há aulas agendadas.</p>}
        </section>
      </div>
    </>
  )

  const renderClasses = () => (
    <section className="academy-panel academy-list-panel">
      <div className="academy-panel-title"><div><span className="academy-eyebrow">APRENDIZAGEM</span><h2>{role === "teacher" ? "As suas turmas" : "Minhas turmas"}</h2></div></div>
      {classes.length ? (
        <div className="academy-class-grid">
          {classes.map((item) => (
            <article className="academy-class-card" key={item.id}>
              <div className="academy-class-cover"><span>{item.name.slice(0, 1).toUpperCase()}</span><small>{role === "teacher" ? "TURMA" : "INSCRITO"}</small></div>
              <div className="academy-class-content">
                <h3>{item.name}</h3>
                <p>{role === "teacher" ? `${item.student_count} ${item.student_count === 1 ? "aluno inscrito" : "alunos inscritos"}` : `Professor: ${item.teacher_name}`}</p>
                <div className="academy-class-footer"><span>{lessons.filter((lesson) => lesson.class_id === item.id).length} aulas</span><span>{schedules.filter((session) => session.room === item.room).length} sessões</span></div>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="academy-empty-copy">{role === "teacher" ? "Ainda não criou nenhuma turma." : "Ainda não está inscrito em nenhuma turma."}</p>}
    </section>
  )

  const renderLessons = () => (
    <section className="academy-panel academy-list-panel">
      <div className="academy-panel-title"><div><span className="academy-eyebrow">BIBLIOTECA</span><h2>Aulas e conteúdos</h2></div></div>
      {lessons.length ? (
        <div className="academy-lesson-list">
          {lessons.map((item) => (
            <article className="academy-lesson-row" key={item.id}>
              <span className="academy-lesson-play"><AcademyIcon name="lessons" /></span>
              <div><strong>{item.title}</strong><small>{item.class_name}</small></div>
              <a href={item.video_url} target="_blank" rel="noreferrer">Abrir aula <span aria-hidden="true">↗</span></a>
            </article>
          ))}
        </div>
      ) : <p className="academy-empty-copy">{role === "teacher" ? "Registe a primeira aula com o endereço do vídeo." : "Ainda não há aulas publicadas nas suas turmas."}</p>}
    </section>
  )

  const renderSchedule = () => (
    <section className="academy-panel academy-list-panel">
      <div className="academy-panel-title"><div><span className="academy-eyebrow">CALENDÁRIO</span><h2>{role === "teacher" ? "Agenda das turmas" : "Próximas aulas ao vivo"}</h2></div></div>
      {schedules.length ? (
        <div className="academy-schedule-list">
          {schedules.map((item) => (
            <article className="academy-schedule-card" key={item.id}>
              <AcademyIcon name="schedule" />
              <div><strong>{item.title}</strong><small>{item.class_name} · {formatDate(item.starts_at)}</small></div>
              <span className="academy-status">{item.status}</span>
            </article>
          ))}
        </div>
      ) : <p className="academy-empty-copy">Ainda não há sessões na agenda.</p>}
    </section>
  )

  const renderStudents = () => (
    <section className="academy-panel academy-list-panel">
      <div className="academy-panel-title"><div><span className="academy-eyebrow">COMUNIDADE</span><h2>Alunos das suas turmas</h2></div></div>
      {classes.some((item) => item.students?.length) ? (
        <div className="academy-student-list">
          {classes.flatMap((item) => item.students.map((student) => ({ ...student, className: item.name, key: `${item.id}-${student.id}` }))).map((student) => (
            <article className="academy-student-row" key={student.key}><span>{student.name.slice(0, 1).toUpperCase()}</span><div><strong>{student.name}</strong><small>{student.className}</small></div></article>
          ))}
        </div>
      ) : <p className="academy-empty-copy">Os alunos inscritos serão apresentados aqui.</p>}
    </section>
  )

  const renderContent = () => {
    if (loading) return <div className="academy-loading"><span />A sincronizar os dados da Academy...</div>
    if (!academy.roles?.student && !academy.roles?.teacher) {
      return <section className="academy-panel academy-no-role"><span className="academy-no-role-icon">A</span><h2>Bem-vindo à Âncora Academy</h2><p>A sua conta ainda não está associada a uma turma como aluno ou professor.</p></section>
    }
    if (section === "classes") return renderClasses()
    if (section === "lessons") return renderLessons()
    if (section === "schedule") return renderSchedule()
    if (section === "students" && role === "teacher") return renderStudents()
    return renderOverview()
  }

  return (
    <main className="ancora-academy">
      <aside className="academy-sidebar">
        <div className="academy-brand"><span className="academy-brand-mark">A</span><div><strong>Âncora</strong><small>ACADEMY</small></div></div>
        <div className="academy-side-label">PLATAFORMA</div>
        <nav className="academy-navigation" aria-label="Navegação da Academy">
          {navItems.map((item) => (
            <button type="button" className={section === item.id ? "is-active" : ""} key={item.id} onClick={() => setSection(item.id)}>
              <AcademyIcon name={item.id === "overview" ? "overview" : item.id} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="academy-sidebar-bottom">
          <div className="academy-sidebar-user"><span>{(academy.profile?.name || dadosUsuario?.nome || "A").slice(0, 1).toUpperCase()}</span><div><strong>{academy.profile?.name || dadosUsuario?.nome || "Utilizador"}</strong><small>{role === "teacher" ? "Professor" : "Aluno"}</small></div></div>
          <button type="button" className="academy-back-link" onClick={() => setAtivar("conteiner5")}><span aria-hidden="true">←</span> Voltar ao perfil</button>
        </div>
      </aside>
      <div className="academy-main">
        <header className="academy-topbar">
          <div className="academy-breadcrumb"><span>Plataforma</span><b>/</b><strong>Âncora Academy</strong></div>
          <div className="academy-top-actions">
            {academy.roles?.student && academy.roles?.teacher && (
              <div className="academy-role-switch" role="group" aria-label="Alternar perfil">
                <button type="button" className={role === "student" ? "is-active" : ""} onClick={() => { setRole("student"); setSection("overview") }}>Aluno</button>
                <button type="button" className={role === "teacher" ? "is-active" : ""} onClick={() => { setRole("teacher"); setSection("overview") }}>Professor</button>
              </div>
            )}
            {role === "teacher" && academy.roles?.teacher && (
              <div className="academy-create-actions">
                <button type="button" className="academy-button academy-button-secondary" onClick={() => openForm("lesson")} disabled={!academy.classes?.teacher?.length}>Nova aula</button>
                <button type="button" className="academy-button academy-button-primary" onClick={() => openForm("class")}>+ Criar turma</button>
              </div>
            )}
          </div>
        </header>
        <div className="academy-content">
          <div className="academy-page-heading">
            <div><span className="academy-eyebrow">CENTRO DE APRENDIZAGEM</span><h1>{role === "teacher" ? "Ensinar e acompanhar" : "A sua jornada de aprendizagem"}</h1><p>{role === "teacher" ? "Gira turmas, aulas e sessões num só lugar." : "Consulte as suas turmas, aulas e próximas sessões."}</p></div>
            {role === "teacher" && academy.roles?.teacher && <button type="button" className="academy-agenda-action" onClick={() => openForm("schedule")} disabled={!academy.classes?.teacher?.length}><AcademyIcon name="schedule" /> Agendar aula</button>}
          </div>
          {notice && <div className="academy-notice" role="status">{notice}</div>}
          {error && !form && <div className="academy-error" role="alert">{error}<button type="button" onClick={() => void loadAcademy()}>Tentar novamente</button></div>}
          {renderContent()}
        </div>
      </div>
      {renderForm()}
    </main>
  )
}
