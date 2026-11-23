# Adversarial review — tiny-stack-vm-01
Reviewer: main session, 23 Nov 2026.
Attacks on main.ts vs ISA.md prose: (1) opcode else-if chain — JMP/JZ/JNZ/
CALL skip the trap-5 branch correctly; unknown bytes trap 5. (2) trap
order — steps++ after pre-checks, before switch; matches ISA. (3) DIV/MOD
edges — INT_MIN/-1 wraps via |0; x%-1 = 0; DIVU/MODU use >>>0. (4) shifts
(b & 31); SHR arithmetic, SHRU logical + |0. (5) stack limits — push()
throws 3 at 256; need() throws 2. (6) CALL u16, 64 held -> trap 7; RET
empty -> trap 8. (7) STORE pops addr then value. (8) output limits checked
before writing. (9) EXIT & 255; PRINT decimal; IN -1 after end. (10) env
vars honored; gate exposed missing --input/--output parsing: FIXED.
Findings: 1 real bug (flag parsing), fixed. 36/36 self-test + grade-local
40/40 + byte-identical regrade. Risks: final set unknowable; server Node
v26.13.1 vs local v24.22.1 (stable stdlib). Verdict: APPROVED.
