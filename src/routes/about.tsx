import { motion } from 'framer-motion'
import { Seo } from '@/components/seo/Seo'
import { Container } from '@/ui/Container'
import { Section } from '@/ui/Section'
import { Card } from '@/ui/Card'
import { Badge } from '@/ui/Badge'
import { variants } from '@/lib/motion'
import { profile } from '@/data/profile'
import { skillCategories } from '@/data/skills'
import { experiences } from '@/data/experiences'

export default function AboutPage() {
  return (
    <>
      <Seo title="关于" description={`了解 ${profile.name} - ${profile.title}`} />
      <Section spacing="lg">
        <Container size="md">
          {/* Intro */}
          <motion.div
            variants={variants.slideUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6 mb-20"
          >
            <h1 className="text-display-lg font-semibold text-text-primary">关于我</h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">
              {profile.bio}
            </p>
          </motion.div>

          {/* Skills */}
          <motion.div
            variants={variants.stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="mb-20"
          >
            <h2 className="text-display-md font-semibold text-text-primary mb-8">技能矩阵</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {skillCategories.map((category) => (
                <motion.div key={category.name} variants={variants.slideUp}>
                  <Card>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">{category.name}</h3>
                    <div className="flex flex-col gap-3">
                      {category.skills.map((skill) => (
                        <div key={skill.name} className="flex items-center justify-between">
                          <span className="text-text-secondary">{skill.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    i < skill.level ? 'bg-gradient' : 'bg-border-default'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-text-tertiary font-mono w-12 text-right">
                              {skill.years}年
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Experience */}
          <motion.div
            variants={variants.stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <h2 className="text-display-md font-semibold text-text-primary mb-8">工作经历</h2>
            <div className="flex flex-col gap-6">
              {experiences.map((exp) => (
                <motion.div key={exp.company} variants={variants.slideUp}>
                  <Card>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">{exp.role}</h3>
                        <span className="text-text-secondary">{exp.company}</span>
                      </div>
                      <Badge>{exp.period}</Badge>
                    </div>
                    <p className="text-text-secondary mb-3">{exp.description}</p>
                    <ul className="flex flex-col gap-2">
                      {exp.achievements.map((achievement) => (
                        <li
                          key={achievement}
                          className="text-sm text-text-tertiary flex items-start gap-2"
                        >
                          <span className="text-info mt-0.5">-</span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  )
}
