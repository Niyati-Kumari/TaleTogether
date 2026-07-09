import { useState } from "react";

interface TipButtonProps {
  storyId: string;
  authorId: string;
  onTip: (storyId: string, amount: number, message?: string) => Promise<void>;
  tipsReceived?: number;
}

const TIP_AMOUNTS = [1, 3, 5, 10, 20];

export const TipButton = ({ storyId, authorId, onTip, tipsReceived = 0 }: TipButtonProps) => {
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(3);
  const [customAmount, setCustomAmount] = useState("");
  const [tipMessage, setTipMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTip = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (!amount || amount <= 0) return;

    setIsProcessing(true);
    try {
      await onTip(storyId, amount, tipMessage);
      setShowTipModal(false);
      setTipMessage("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="tip-button"
        onClick={() => setShowTipModal(true)}
      >
        💝 Tip Writer {tipsReceived > 0 && <span className="tip-count">({tipsReceived})</span>}
      </button>

      {showTipModal && (
        <div className="modal-overlay" onClick={() => setShowTipModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowTipModal(false)}
            >
              ✕
            </button>
            <h2>Support this Writer</h2>
            <p className="muted">Your tip directly supports the creator!</p>

            <div className="tip-amounts">
              {TIP_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={`tip-amount-button ${
                    selectedAmount === amount && !customAmount ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                >
                  ${amount}
                </button>
              ))}
              <input
                type="number"
                className="tip-custom-input"
                placeholder="Custom"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  if (e.target.value) setSelectedAmount(0);
                }}
                min="0.5"
                step="0.5"
              />
            </div>

            <div className="tip-message-section">
              <label htmlFor="tip-message" className="form-label">
                Message (optional)
              </label>
              <textarea
                id="tip-message"
                className="form-input"
                placeholder="Say something nice..."
                value={tipMessage}
                onChange={(e) => setTipMessage(e.target.value)}
                rows={3}
              />
            </div>

            <button
              type="button"
              className="button primary"
              onClick={handleTip}
              disabled={isProcessing}
            >
              {isProcessing
                ? "Processing..."
                : `Send $${customAmount || selectedAmount}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
