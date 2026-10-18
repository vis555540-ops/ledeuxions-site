;;;=============================================================================
;;; style_fix_nanum.lsp
;;; 도면 안의 모든 문자 스타일(STYLE) 글꼴을 NanumGothic.ttf 로 바꾸고 REGENALL 합니다.
;;;
;;; 쓰는 경우:
;;;   - R2018 로 다시 저장한 뒤에도 일부 한글이 ??로 남을 때
;;;   - SHX 글꼴(윈도우 전용 한글 SHX 등)이 없는 환경에서 한글이 ????로 보일 때
;;;
;;; 사용 전 확인:
;;;   - 나눔고딕(NanumGothic.ttf)이 컴퓨터에 설치되어 있어야 합니다.
;;;   - 모든 스타일이 바뀝니다. 꼭 사본 도면에서 먼저 해보십시오.
;;;   - 높이 0(고정 안 함), 폭 비율 1, 기울기 0 으로 다시 설정합니다.
;;;     원래 폭 비율을 쓰던 도면은 글자 폭이 달라질 수 있습니다.
;;;   - 캐드 종류·버전에 따라 -STYLE 명령의 질문 순서가 다를 수 있습니다.
;;;     멈추면 ESC 후 STYLE 대화상자에서 직접 바꾸십시오.
;;;
;;; 사용법 (캐드 명령창에 입력):
;;;   (load "C:/경로/style_fix_nanum.lsp")         ; 윈도우 예
;;;   (load "/home/사용자/style_fix_nanum.lsp")     ; 리눅스·맥 예
;;;   ※ 경로는 이 파일을 내려받은 위치로 바꾸십시오.
;;;=============================================================================

(vl-load-com)
(princ "\n;; style_fix_nanum: all STYLE fonts -> NanumGothic.ttf")

(setq tbl (tblnext "STYLE" T))
(setq cnt 0)
(while tbl
  (setq nm (cdr (assoc 2 tbl)))
  ;; 이름 없는 스타일(모양 파일용)은 건너뜁니다
  (if (and nm (/= nm ""))
    (progn
      (vl-cmdf "_-STYLE" nm "NanumGothic.ttf" "0" "1" "0" "N" "N")
      (setq cnt (1+ cnt))
      (princ (strcat "\n;;  STYLE '" nm "' -> NanumGothic"))))
  (setq tbl (tblnext "STYLE")))

(command "_REGENALL")
(princ (strcat "\n;; OK: " (itoa cnt) " style(s) changed, REGENALL done"))
(princ)
