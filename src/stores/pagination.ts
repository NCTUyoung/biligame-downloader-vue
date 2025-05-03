import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useShipStore } from './ships'

export const usePaginationStore = defineStore('pagination', () => {
  const shipStore = useShipStore()

  // 分页设置
  const pagination = ref({
    current: 1,
    pageSize: 40,
    pageSizeOptions: ['20', '40', '60', '80', '100']
  })

  // 搜索关键词
  const searchKeyword = ref('')

  // 过滤后的船舰数据
  const filteredShips = computed(() => {
    if (!shipStore.ships || !searchKeyword.value.trim()) {
      return shipStore.ships || []
    }

    const keyword = searchKeyword.value.toLowerCase().trim()
    return shipStore.ships.filter(ship =>
      ship.name.toLowerCase().includes(keyword) ||
      ship.faction.toLowerCase().includes(keyword) ||
      ship.rarity.toLowerCase().includes(keyword)
    )
  })

  // 当前页的数据
  const currentPageShips = computed(() => {
    const startIndex = (pagination.value.current - 1) * pagination.value.pageSize
    const endIndex = startIndex + pagination.value.pageSize
    return filteredShips.value.slice(startIndex, endIndex)
  })

  // 改变页码
  function handlePageChange(page: number, pageSize?: number) {
    pagination.value.current = page
    if (pageSize) pagination.value.pageSize = pageSize
  }

  // 设置搜索关键词
  function setSearchKeyword(keyword: string) {
    searchKeyword.value = keyword
    pagination.value.current = 1 // 重置到第一页
  }

  return {
    pagination,
    searchKeyword,
    filteredShips,
    currentPageShips,
    handlePageChange,
    setSearchKeyword
  }
})