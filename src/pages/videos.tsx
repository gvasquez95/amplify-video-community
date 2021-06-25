import React from 'react'
import Loader from 'react-loader-spinner'
import { useEffect, useState } from 'react'
import styled from 'styled-components'

import { Thumbnail } from '../shared/types'
import {
    Layout,
    Section,
    HighlightedSection,
    VideoCardSlider,
} from '../shared/components'
import {
    fetchSections,
    fetchVodFiles,
    fetchThumbnail,
} from '../shared/utilities'
import { vodAsset, section } from '../models'

const SectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 25px;
`

const VodApp = () => {
    const [vodAssets, setVodAssets] = useState<Array<vodAsset>>([])
    const [thumbnails, setThumbnails] = useState<Array<Thumbnail>>([])
    const [sections, setSections] = useState<Array<section> | null>(null)
    const [nextTokenVodFiles, setNextTokenVodFiles] =
        useState<string | null>(null)
    const [loadingVodFiles, setLoadingVodFiles] = useState(false)
    const [loadingSections, setLoadingSections] = useState(false)

    useEffect(() => {
        ;(async () => {
            setLoadingVodFiles(true)
            try {
                const { data } = await fetchVodFiles(nextTokenVodFiles)
                setNextTokenVodFiles(
                    data?.listVodAssets?.nextToken
                        ? data.listVodAssets.nextToken
                        : null
                )
                const assets = data?.listVodAssets?.items as Array<vodAsset>
                setVodAssets(assets)

                const thumbnailArr: Array<Thumbnail> = []
                await Promise.all(
                    assets.map(async (asset) => {
                        const data = await fetchThumbnail(asset)
                        thumbnailArr.push({
                            obj: asset.thumbnail,
                            url: data as string,
                        })
                    })
                )
                setThumbnails(thumbnailArr)
            } catch (error) {
                console.error('videos.tsx(fetchVodFiles):', error)
            }
            setLoadingVodFiles(false)
        })()
    }, [nextTokenVodFiles])

    useEffect(() => {
        ;(async () => {
            setLoadingSections(true)
            try {
                const { data } = await fetchSections()
                let nonce = true
                const list = data?.listSections?.items as Array<section>
                list.forEach((item, index, arr) => {
                    if (arr.length <= 3 && nonce) {
                        arr.push({
                            label: 'Highlighted',
                            id: `Highlighted${index}`,
                        })
                        nonce = false
                    }
                    if (
                        index % 3 === 0 &&
                        index !== 0 &&
                        item?.label !== 'Highlighted'
                    ) {
                        arr.splice(index, 0, {
                            label: 'Highlighted',
                            id: `Highlighted${index}`,
                        })
                    }
                })
                setSections(list)
            } catch (error) {
                console.error('videos.tsx(fetchSections)', error)
            }
            setLoadingSections(false)
        })()
    }, [])

    return (
        <Layout>
            {loadingVodFiles || loadingSections ? (
                <Loader
                    type="Bars"
                    color="#FFA41C"
                    height={100}
                    width={100}
                    timeout={3000}
                />
            ) : (
                <SectionContainer>
                    <VideoCardSlider vod={vodAssets} thumbnails={thumbnails} />
                    {sections &&
                        sections.map((section: section) => {
                            return section.label === 'Highlighted' ? (
                                <HighlightedSection
                                    key={section.id}
                                    title={section.label}
                                    vodAsset={vodAssets
                                        .filter(
                                            (item: vodAsset) => item.highlighted
                                        )
                                        .pop()}
                                    thumbnails={thumbnails}
                                />
                            ) : (
                                <Section
                                    key={section.id}
                                    section={section}
                                    vodAssets={vodAssets}
                                    thumbnails={thumbnails}
                                />
                            )
                        })}
                </SectionContainer>
            )}
        </Layout>
    )
}

export default VodApp
