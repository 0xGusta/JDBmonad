import React from "react";
import { formatEther } from "ethers";
import { useLanguage } from "../App.jsx";

const LastDraw = ({ lastDraw }) => {
  const { t, language } = useLanguage();

  if (!lastDraw) {
    return (
      <div className="card last-draw-card">
        <h2>{t("last_draw.title")}</h2>
        <p>{t("last_draw.no_draws")}</p>
      </div>
    );
  }

  return (
    <div className="card last-draw-card">
      <h2>{t("last_draw.draw_id", { id: lastDraw.id.toString() })}</h2>
      <div className="draw-details">
        <div className="detail-item">
          <span>{t("last_draw.number")} </span>
          <strong className="winning-number">
            {lastDraw.winningNumber.toString().padStart(2, "0")}
          </strong>
        </div>
        <div className="detail-item">
          <span>{t("last_draw.monanimal")} </span>
          <strong>{lastDraw.winningAnimal}</strong>
        </div>
        <div className="detail-item">
          <span>{t("last_draw.total_prize")} </span>
          <strong>
            {new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(formatEther(lastDraw.totalPot))}{" "}
            MON
          </strong>
        </div>
        <div className="detail-item">
          <span>
            {new Date(Number(lastDraw.timestamp) * 1000).toLocaleString(language === "pt" ? "pt-BR" : "en-US")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LastDraw;
