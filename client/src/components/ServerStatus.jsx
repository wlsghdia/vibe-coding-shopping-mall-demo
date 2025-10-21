import { memo } from 'react'

const ServerStatus = memo(({ serverStatus, loading, onCheckStatus }) => {
  return (
    <div className="dev-section" style={{ display: 'none' }}>
      <div className="server-status">
        <h2>서버 상태</h2>
        <button 
          onClick={onCheckStatus} 
          disabled={loading}
          className="check-button"
        >
          {loading ? '확인 중...' : '서버 상태 확인'}
        </button>
        
        {serverStatus && (
          <div className={`status-card ${serverStatus.status}`}>
            <h3>상태: {serverStatus.status}</h3>
            {serverStatus.message && <p>{serverStatus.message}</p>}
            {serverStatus.database && <p>데이터베이스: {serverStatus.database}</p>}
            {serverStatus.uptime && <p>업타임: {Math.round(serverStatus.uptime)}초</p>}
            {serverStatus.timestamp && <p>시간: {new Date(serverStatus.timestamp).toLocaleString()}</p>}
          </div>
        )}
      </div>
    </div>
  )
})

ServerStatus.displayName = 'ServerStatus'

export default ServerStatus
