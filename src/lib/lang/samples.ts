export type Preset = { id: string; label: string; hint: string; x52: string; x52p: string };

export const PRESETS: Preset[] = [
  {
    id: "sum",
    label: "รวมลำดับ",
    hint: "บวก 0 ถึง n-1",
    x52: `fn main() {
  let n = 3000000
  let s = 0
  let i = 0
  while i < n {
    s = s + i
    i = i + 1
  }
  print(s)
}
`,
    x52p: `$main(){
n=3000000;s=0;i=0
~i<n{s=s+i;i=i+1}
!s
}
`,
  },
  {
    id: "mix",
    label: "สะสมคูณ",
    hint: "วนคูณแล้วหารเอาเศษ",
    x52: `fn main() {
  let n = 2500000
  let x = 1
  let i = 0
  while i < n {
    x = (x * 13 + i) % 1000003
    i = i + 1
  }
  print(x)
}
`,
    x52p: `$main(){
n=2500000;x=1;i=0
~i<n{x=(x*13+i)%1000003;i=i+1}
!x
}
`,
  },
  {
    id: "call",
    label: "เรียกฟังก์ชัน",
    hint: "ทุกอบเรียกฟังก์ชันหนึ่งครั้ง",
    x52: `fn tick(x) {
  return (x * 13 + 7) % 1000003
}

fn main() {
  let n = 1200000
  let x = 1
  let i = 0
  while i < n {
    x = tick(x)
    i = i + 1
  }
  print(x)
}
`,
    x52p: `$tick(x){^(x*13+7)%1000003}
$main(){
n=1200000;x=1;i=0
~i<n{x=tick(x);i=i+1}
!x
}
`,
  },
];

export type ProjFile = { path: string; body: string };

export const TEMPLATE_X52: ProjFile[] = [
  {
    path: "src/util.x52",
    body: `fn double(x) {
  return x + x
}

fn clamp(x) {
  if x > 100 {
    return 100
  }
  return x
}
`,
  },
  {
    path: "src/main.x52",
    body: `fn main() {
  let n = 40
  let s = 0
  let i = 1
  while i <= n {
    s = s + double(i)
    i = i + 1
  }
  print(clamp(s))
  print(s)
}
`,
  },
];

export const TEMPLATE_X52P: ProjFile[] = [
  {
    path: "src/util.x52p",
    body: `$double(x){^x+x}
$clamp(x){?x>100{^100};^x}
`,
  },
  {
    path: "src/main.x52p",
    body: `$main(){
n=40;s=0;i=1
~i<=n{s=s+double(i);i=i+1}
!clamp(s)
!s
}
`,
  },
];

export const MAP_ROWS: { easy: string; fast: string; means: string }[] = [
  { easy: "fn main() { }", fast: "$main(){ }", means: "ฟังก์ชัน" },
  { easy: "let n = 1", fast: "n=1", means: "ตั้งค่า" },
  { easy: "while i < n { }", fast: "~i<n{ }", means: "วนลูป" },
  { easy: "if a { } else { }", fast: "?a{ }:{ }", means: "แยกทาง" },
  { easy: "print(n)", fast: "!n", means: "พิมพ์" },
  { easy: "return n", fast: "^n", means: "ส่งค่ากลับ" },
];
