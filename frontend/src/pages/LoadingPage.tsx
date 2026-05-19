import './LoadingPage.css';

export function LoadingPage() {
  return (
    <div className="loading-page">
      <div className="loading-page__bg-decoration">
        <div className="loading-page__orb loading-page__orb--1" />
        <div className="loading-page__orb loading-page__orb--2" />
      </div>

      <div className="loading-container">
        <div className="loading-brand">
          <div className="loading-logo">M</div>
          <h1 className="loading-title">
            moku<span>vation</span>
          </h1>
        </div>

        <div className="loading-spinner">
          <div className="spinner-ring" />
        </div>

        <p className="loading-text">認証確認中...</p>
      </div>
    </div>
  );
}
