import { motion } from 'framer-motion'
import { Wrench, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Card } from '@/ui/Card'
import { variants } from '@/lib/motion'

const tools = [
  {
    title: '颜色转换',
    description: 'HEX、RGB、HSL 互转，带预览与调色。支持透明色叠加计算。',
    path: '/tools/color',
    available: true,
  },
  {
    title: 'JSON 格式化',
    description: 'JSON 解析、格式化、压缩与校验。',
    path: '/tools/json',
    available: false,
  },
  {
    title: 'Base64 编解码',
    description: '文本与 Base64 互转，支持 Unicode。',
    path: '/tools/base64',
    available: false,
  },
  {
    title: 'URL 编解码',
    description: 'encodeURIComponent / decodeURIComponent 工具。',
    path: '/tools/url',
    available: false,
  },
  {
    title: '正则测试',
    description: '实时正则匹配、分组捕获与高亮。',
    path: '/tools/regex',
    available: false,
  },
  {
    title: '时间戳转换',
    description: 'Unix 时间戳与日期格式互转。',
    path: '/tools/timestamp',
    available: false,
  },
  {
    title: '文本差异对比',
    description: '逐行 Diff 对比两段文本。',
    path: '/tools/diff',
    available: false,
  },
  {
    title: 'UUID 生成',
    description: '批量生成 UUID v4，一键复制。',
    path: '/tools/uuid',
    available: false,
  },
  {
    title: 'Markdown 预览',
    description: '实时渲染 Markdown，支持代码高亮。',
    path: '/tools/markdown',
    available: false,
  },
]

export default function ToolsPage() {
  return (
    <>
      <Seo title="工具箱" description="前端常用小工具集合" />
      <Section spacing="lg">
        <Container size="lg">
          <div className="flex items-center gap-3 mb-4">
            <Wrench size={32} className="text-text-primary" />
            <h1 className="text-display-lg font-semibold text-text-primary">工具箱</h1>
          </div>
          <p className="text-text-secondary mb-12">前端开发常用小工具集合。</p>

          <motion.div
            variants={variants.stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {tools.map((tool) => (
              <motion.div key={tool.title} variants={variants.slideUp}>
                <Link to={tool.available ? tool.path : '/tools'}>
                  <Card className="group cursor-pointer h-full">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-1 group-hover:text-gradient transition-colors">
                          {tool.title}
                        </h3>
                        <p className="text-sm text-text-secondary">{tool.description}</p>
                      </div>
                      {tool.available ? (
                        <ArrowRight
                          size={18}
                          className="text-text-tertiary group-hover:text-text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1"
                        />
                      ) : (
                        <span className="text-xs font-mono text-text-tertiary px-2 py-1 rounded-sm bg-bg-elevated border border-border-subtle shrink-0 mt-1">
                          敬请期待
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
