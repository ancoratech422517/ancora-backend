import loadingDocument from "../../loading.html?raw"
import "./ContainerLoading.css"

export default function ContainerLoading({
  className = "",
  label = "A carregar",
  overlay = false,
}) {
  const classes = [
    "container-loading",
    overlay ? "container-loading-overlay" : "",
    className,
  ].filter(Boolean).join(" ")

  return (
    <div className={classes} role="status" aria-label={label} aria-live="polite">
      <iframe
        className="container-loading-frame"
        title={label}
        srcDoc={loadingDocument}
        sandbox=""
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  )
}
