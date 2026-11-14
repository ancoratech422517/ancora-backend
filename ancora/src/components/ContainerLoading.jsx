import "./ContainerLoading.css"

export default function ContainerLoading({
  className = "",
  label = "A carregar",
  overlay = false,
  global = false,
}) {
  const classes = [
    "container-loading",
    overlay ? "container-loading-overlay" : "",
    global ? "container-loading-global" : "",
    className,
  ].filter(Boolean).join(" ")

  return (
    <div className={classes} role="status" aria-label={label} aria-live="polite">
      <div className="container-loading-bars" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
