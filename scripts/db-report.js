const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables")
  process.exit(1)
}

// Fetch all students
const res = await fetch(
  `${supabaseUrl}/rest/v1/profiles?role=eq.student&select=id,email,full_name,belt,degree,total_classes,cycle_classes,belt_locked&order=total_classes.desc`,
  {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    }
  }
)

const students = await res.json()

console.log("=".repeat(80))
console.log("RELATORIO DO BANCO DE DADOS - JUNGLE JIU-JITSU")
console.log("=".repeat(80))

// Estatisticas gerais
console.log("\n--- ESTATISTICAS GERAIS ---")
console.log(`Total de alunos: ${students.length}`)

// Por faixa
const beltCount = { white: 0, blue: 0, purple: 0, brown: 0, black: 0 }
students.forEach(s => beltCount[s.belt] = (beltCount[s.belt] || 0) + 1)
console.log("\nDistribuicao por faixa:")
console.log(`  Branca: ${beltCount.white}`)
console.log(`  Azul: ${beltCount.blue}`)
console.log(`  Roxa: ${beltCount.purple}`)
console.log(`  Marrom: ${beltCount.brown}`)
console.log(`  Preta: ${beltCount.black}`)

// Verificar consistencia total_classes vs cycle_classes
const synced = students.filter(s => s.total_classes === s.cycle_classes).length
const notSynced = students.filter(s => s.total_classes !== s.cycle_classes)
console.log(`\nAlunos com total_classes = cycle_classes: ${synced}/${students.length}`)

if (notSynced.length > 0) {
  console.log(`Alunos com valores diferentes: ${notSynced.length}`)
  notSynced.slice(0, 5).forEach(s => {
    console.log(`  - ${s.email}: total=${s.total_classes}, cycle=${s.cycle_classes}`)
  })
}

// Top 10 alunos com mais aulas
console.log("\n--- TOP 10 ALUNOS (mais aulas) ---")
students.slice(0, 10).forEach((s, i) => {
  console.log(`${i+1}. ${s.full_name || s.email} - ${s.belt} ${s.degree}g - ${s.total_classes} aulas (cycle: ${s.cycle_classes})`)
})

// Alunos prontos para graduacao (baseado na logica do sistema)
const CLASSES_PER_GRADE = { white: 35, blue: 65, purple: 75, brown: 85, black: null }

const readyForPromotion = students.filter(s => {
  if (s.belt === 'black') return false
  const needed = CLASSES_PER_GRADE[s.belt]
  return s.cycle_classes >= needed
})

console.log("\n--- ALUNOS PRONTOS PARA GRADUACAO ---")
console.log(`Total: ${readyForPromotion.length}`)
readyForPromotion.forEach(s => {
  const needed = CLASSES_PER_GRADE[s.belt]
  const action = s.degree < 4 ? `proximo grau (${s.degree + 1}g)` : 'proxima faixa'
  console.log(`  - ${s.full_name || s.email}: ${s.belt} ${s.degree}g - ${s.cycle_classes}/${needed} aulas -> ${action}`)
})

// Estatisticas de aulas
const totalAulas = students.reduce((sum, s) => sum + s.total_classes, 0)
const avgAulas = (totalAulas / students.length).toFixed(1)
const maxAulas = Math.max(...students.map(s => s.total_classes))
const minAulas = Math.min(...students.map(s => s.total_classes))

console.log("\n--- ESTATISTICAS DE AULAS ---")
console.log(`Total de aulas registradas: ${totalAulas}`)
console.log(`Media por aluno: ${avgAulas}`)
console.log(`Maximo: ${maxAulas}`)
console.log(`Minimo: ${minAulas}`)

console.log("\n" + "=".repeat(80))
console.log("FIM DO RELATORIO")
console.log("=".repeat(80))
