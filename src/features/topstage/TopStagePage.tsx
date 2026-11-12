import { useSearchParams } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import TopStageV1 from './TopStageV1'
import TopStageV2 from './TopStageV2'

export default function TopStagePage() {
  const [params] = useSearchParams()
  const version = params.get('v') === '2' ? <TopStageV2 /> : <TopStageV1 />

  return (
    <>
      <Seo title="TOPSTAGE 10TH ANNIVERSARY · 11.28" description="TOPSTAGE 10周年活动 · 2016-2026 · 11.28 SAT. 14:00-18:00" />
      {version}
    </>
  )
}
