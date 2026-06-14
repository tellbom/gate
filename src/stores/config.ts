/*
 * @Author: fzq
 * @Date: 2026-06-09 20:00:45
 * @LastEditors: fzq
 * @LastEditTime: 2026-06-09 20:43:45
 * @Description: 
 * @FilePath: \web\src\stores\config.ts
 */
import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { STORE_CONFIG } from '/@/stores/constant/cacheKey'
import type { Lang, Layout } from '/@/stores/interface'

export const useConfig = defineStore(
    'config',
    () => {
        const layout: Layout = reactive({
            showDrawer: false,
            shrink: false,
            layoutMode: 'Classic',
            mainAnimation: 'slide-right',
            isDark: false,

            // Light Classic sidebar: quiet background, dark text, blue selected state.
            menuBackground: ['#f5f7fb', '#1d1d1f'],
            menuColor: ['#1d1d1f', '#f5f5f7'],
            menuActiveBackground: ['#e8f1ff', '#123f72'],
            menuActiveColor: ['#0066cc', '#ffffff'],
            menuTopBarBackground: ['#f5f7fb', '#1d1d1f'],
            menuWidth: 260,
            menuDefaultIcon: 'fa fa-circle-o',
            menuCollapse: false,
            menuUniqueOpened: false,
            menuShowTopBar: true,

            headerBarTabColor: ['#1d1d1f', '#cccccc'],
            headerBarTabActiveBackground: ['#f5f5f7', '#272729'],
            headerBarTabActiveColor: ['#0066cc', '#2997ff'],
            headerBarBackground: ['#ffffff', '#1d1d1f'],
            headerBarHoverBackground: ['#f5f5f7', '#272729'],
        })

        const lang: Lang = reactive({
            defaultLang: 'zh-cn',
            fallbackLang: 'zh-cn',
            langArray: [
                { name: 'zh-cn', value: '中文简体' },
                { name: 'en', value: 'English' },
            ],
        })

        function menuWidth() {
            if (layout.shrink) {
                return layout.menuCollapse ? '0px' : layout.menuWidth + 'px'
            }

            return layout.menuCollapse ? '64px' : layout.menuWidth + 'px'
        }

        function setLang(val: string) {
            lang.defaultLang = val
        }

        function onSetLayoutColor(data = layout.layoutMode) {
            const tempValue = layout.isDark ? { idx: 1, color: '#1d1d1f', newColor: '#272729' } : { idx: 0, color: '#ffffff', newColor: '#f5f5f7' }
            if (
                data == 'Classic' &&
                layout.headerBarBackground[tempValue.idx] == tempValue.color &&
                layout.headerBarTabActiveBackground[tempValue.idx] == tempValue.color
            ) {
                layout.headerBarTabActiveBackground[tempValue.idx] = tempValue.newColor
            } else if (
                data == 'Default' &&
                layout.headerBarBackground[tempValue.idx] == tempValue.color &&
                layout.headerBarTabActiveBackground[tempValue.idx] == tempValue.newColor
            ) {
                layout.headerBarTabActiveBackground[tempValue.idx] = tempValue.color
            }
        }

        function setLayoutMode(data: string) {
            layout.layoutMode = data
            onSetLayoutColor(data)
        }

        const setLayout = (name: keyof Layout, value: any) => {
            layout[name] = value as never
        }

        const getColorVal = function (name: keyof Layout): string {
            const colors = layout[name] as string[]
            return layout.isDark ? colors[1] : colors[0]
        }

        return { layout, lang, menuWidth, setLang, setLayoutMode, setLayout, getColorVal, onSetLayoutColor }
    },
    {
        persist: {
            key: STORE_CONFIG,
        },
    }
)
