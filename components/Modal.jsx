import { useEffect, useRef } from "react";
import style from "../styles/modal.module.css";
import { X } from "@phosphor-icons/react";

function Modal({
  open,
  modalLable,
  children,
  onClose = () => {},
  customContainer,
  customModal,
  isCloseIcon,
  isBackdropClose = true,
}) {
  const modalContainerRef = useRef();

  useEffect(() => {
    document.body.classList.toggle("noscroll", open);
  }, [open]);

  const handleClose = (e) => {
    if (modalContainerRef.current === e.target && isBackdropClose) {
      onClose();
    }
    return null;
  };

  if (open) {
    return (
      <div
        className={`${style.modalContainer} ${customContainer}`}
        onClick={handleClose}
        ref={modalContainerRef}
      >
        <div className={`${customModal} ${style.modal}`}>
          <div className={style.modal__head}>
            {isCloseIcon && (
              <div className="flex w-full items-center justify-between">
                <h2 className="font-medium text-lg">{modalLable}</h2>
                <span className={style.modal__close} onClick={onClose}>
                  <X size={20} />
                </span>
              </div>
            )}
          </div>
          {children}
        </div>
      </div>
    );
  }
  return null;
}

export default Modal;
