;;;=============================================================================
;;; permanent_save.lsp
;;; 옛 형식(ANSI_949/CP949)으로 저장된 도면을 R2018 DWG(UTF-8)로 다시 저장합니다.
;;; ZWCAD·AutoCAD 옛 도면을 BricsCAD(맥·리눅스) 등에서 열 때 한글이 ??로
;;; 보이는 경우에 씁니다.
;;;
;;; 사용법 (캐드 명령창에 입력):
;;;   (load "C:/경로/permanent_save.lsp")        ; 윈도우 예
;;;   (load "/home/사용자/permanent_save.lsp")    ; 리눅스·맥 예
;;;   ※ 경로는 이 파일을 내려받은 위치로 바꾸십시오. 구분자는 / 를 씁니다.
;;;
;;; 동작:
;;;   1. 지금 열린 도면을 R2018 DWG 형식으로 다른 이름 저장합니다.
;;;   2. 저장 이름 = [원본이름]_UTF8.dwg (원본과 같은 폴더)
;;;      원본 파일은 건드리지 않습니다.
;;;   3. 도면을 닫고, 새로 저장된 파일을 다시 열면 한글이 보입니다.
;;;
;;; 출력 메시지는 캐드 종류에 따라 한글이 깨질 수 있어 영문으로 둡니다.
;;;=============================================================================

(vl-load-com)
(princ "\n;; permanent_save: ANSI_949 -> R2018 (UTF-8)")

(setq doc (vla-get-activedocument (vlax-get-acad-object)))
(setq orig-fullname (vla-get-fullname doc))
(setq orig-name (vl-filename-base orig-fullname))

;; 저장할 폴더. 기본값은 원본과 같은 폴더입니다.
;; 다른 곳에 저장하려면 아래 줄을 예시처럼 바꾸십시오. 끝에 / 를 붙입니다.
;;   (setq out-dir "C:/도면/변환/")
;;   (setq out-dir "/home/사용자/바탕화면/")
(setq out-dir (strcat (vl-filename-directory orig-fullname) "/"))

(setq target (strcat out-dir orig-name "_UTF8.dwg"))

(princ (strcat "\n;; source: " orig-fullname))
(princ (strcat "\n;; target: " target))

;; 60 = acR2018_dwg
(setq r (vl-catch-all-apply 'vla-saveas (list doc target 60)))

(if (vl-catch-all-error-p r)
  (progn
    (princ (strcat "\n;; FAIL: " (vl-catch-all-error-message r)))
    (princ "\n;; Try manually: SAVEAS -> AutoCAD 2018 DWG (*.dwg)"))
  (progn
    (princ "\n;; OK: saved as R2018 DWG")
    (princ "\n;; Next: 1) CLOSE this drawing  2) OPEN the target file above")))

(princ)
