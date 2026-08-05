import AccountPanel from './AccountPanel'
import DataBackup from './DataBackup'

function DataProtectionPage({
  captures,
  missions,
  activeFocusSession,
  focusSessions,
  dailyPlan,
  onRestore,
}) {
  return (
    <>
      <header className="data-page-header">
        <p className="norte-wordmark">NORTE</p>
        <h1>Meus dados</h1>
        <p>
          Crie uma cópia segura das suas informações ou
          restaure um backup anterior.
        </p>
      </header>

      <AccountPanel />

      <DataBackup
        captures={captures}
        missions={missions}
        activeFocusSession={activeFocusSession}
        focusSessions={focusSessions}
        dailyPlan={dailyPlan}
        onRestore={onRestore}
      />
    </>
  )
}

export default DataProtectionPage
