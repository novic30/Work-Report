
32 Bit:
This is to check all the syscall numbers:
less /usr/include/x86_64-linux-gnu/asm/unistd_32.h
eax - syscall number
ebx - First arg
ecx - Second arg
edx - Third arg
Now, using that we can write asm code like
define __NR_execve 11
Thus, in shellcode, we do mov al, 0x0b;11 for execve
![[Pasted image 20260715083144.png]]
1. Makes eax 000000
2. push eax to the stack
3. push //sh to stack
4. push /bin to stack
5. mov into ebx (first argument) the stack which is /bin//sh\0 where eax is null terminator
6. push NULL to stack which was emptied
7. push the /bin/bash again
8. push all this into ecx which is like argv
9. NULL out third argument
10. make syscall eax low byte to execve
11. run execve by doing interrupt 0x80 which tells about running execve
Goal: execve("/bin//sh",\[/bin//sh. NULL], NULL);

RUN:
nasm -f elf32 exec32.asm -o exec32.o
ld -m elf_i386 exec32.0 -o exec32
./exec32


\[AA,BB,CC,DD]
Big Endian: AABBCCDD
Little Endian: DDCCBBAA



64 Bit:
rdi - syscall number
rbx - First arg
rcx - Second arg
edx - Third arg
This is to check all the syscall numbers:
less /usr/include/x86_64-linux-gnu/asm/unistd_64.h
![[Pasted image 20260715085133.png]]
rax = execve,            rdi = /bin/sh,        rsi = \[/bin/sh, NULL],       rdx = NULL
execve("/bin/sh",\[/bin/sh, NULL], NULL)

1. NULL eax also zeros rax since 32 bit register nulled also zeros corresponding 64 bit register
2. bin sh to rbx which is pushed onto the stack. NO NULL TERMINATOR TO END THE COMMAND, maybe ebx should remove one of the 2f and start with 00 for null terminator
3. 


RUN:
nasm -f elf64 exec64.asm -o exec64.o
ld -m elf_x86_64 exec64.0 -o exec64
./exec64


TO SEE elf decoding:
hd ./exec64 | l
objdump -D -Mintel ./exec64 | less