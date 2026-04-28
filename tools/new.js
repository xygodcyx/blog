const { execSync } = require('child_process')
const path = require('path')

const [dir, title] = process.argv.slice(2)

if (!dir) {
  console.error(
    '❌ 请指定目录，例如: npm run new tec "文章标题"',
  )
  process.exit(1)
}

if (!title) {
  console.error(
    '❌ 请指定标题，例如: npm run new tec "文章标题"',
  )
  process.exit(1)
}

execSync(`hexo new "${title}" -p ${dir}/${title}`, {
  stdio: 'inherit',
})

const filePath = path.resolve(
  'source',
  '_posts',
  `${dir}/${title}.md`,
)
execSync(`code ${filePath}`, {
  stdio: 'inherit',
})
