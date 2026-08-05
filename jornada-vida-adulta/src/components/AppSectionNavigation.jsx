const APP_SECTIONS = [
  { value: 'now', label: 'Agora' },
  { value: 'data', label: 'Meus dados' },
]

function AppSectionNavigation({ value, onChange }) {
  return (
    <nav
      className="app-section-navigation"
      aria-label="Seções do NORTE"
    >
      {APP_SECTIONS.map((section) => (
        <button
          key={section.value}
          type="button"
          aria-current={
            value === section.value ? 'page' : undefined
          }
          onClick={() => onChange(section.value)}
        >
          {section.label}
        </button>
      ))}
    </nav>
  )
}

export default AppSectionNavigation
