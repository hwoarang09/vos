import React, { useEffect, useState } from "react";
import { useCFGStore } from "../../../store/cfgStore";
import { useMenuStore } from "../../../store/menuStore";

/**
 * CFGLoader component - Handles CFG file loading
 */
const CFGLoader: React.FC = () => {
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const { isLoading, error, loadCFGFiles } = useCFGStore();
  const { setActiveMainMenu } = useMenuStore();

  // Auto-load CFG files when component mounts
  useEffect(() => {
    if (!autoLoaded) {
      handleLoad();
      setAutoLoaded(true);
    }
  }, [autoLoaded]);

  // Auto-close modal after successful load
  useEffect(() => {
    if (!isLoading && !error && autoLoaded) {
      const timer = setTimeout(() => {
        setShowModal(false);
        setActiveMainMenu(null); // Close any active menu
      }, 2000); // 2초 후 자동 닫기

      return () => clearTimeout(timer);
    }
  }, [isLoading, error, autoLoaded, setActiveMainMenu]);

  const handleLoad = async () => {
    try {
      await loadCFGFiles();
    } catch (error) {
      console.error("Failed to load CFG files:", error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setActiveMainMenu(null);
  };

  // 모달이 숨겨져 있으면 렌더링하지 않음
  if (!showModal) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "20px",
        borderRadius: "8px",
        textAlign: "center",
        zIndex: 1000,
        minWidth: "300px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h3 style={{ margin: "0", fontSize: "18px" }}>CFG 맵 로더</h3>
        <button
          onClick={handleClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#999",
            fontSize: "20px",
            cursor: "pointer",
            padding: "0",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="닫기"
        >
          ×
        </button>
      </div>

      {isLoading ? (
        <div>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #333",
              borderTop: "4px solid #fff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 15px auto",
            }}
          />
          <p style={{ margin: "0", fontSize: "14px" }}>
            CFG 파일을 불러오는 중...
          </p>
        </div>
      ) : error ? (
        <div>
          <p
            style={{
              margin: "0 0 15px 0",
              fontSize: "14px",
              color: "#ff6b6b",
            }}
          >
            오류: {error}
          </p>
          <button
            onClick={handleLoad}
            style={{
              background: "#ff6b6b",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div>
          <p
            style={{
              margin: "0 0 15px 0",
              fontSize: "14px",
              color: "#4ecdc4",
            }}
          >
            CFG 맵 데이터가 성공적으로 로드되었습니다!
          </p>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}
          >
            <button
              onClick={handleLoad}
              style={{
                background: "#4ecdc4",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              다시 로드
            </button>
            <button
              onClick={handleClose}
              style={{
                background: "#666",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CFGLoader;
