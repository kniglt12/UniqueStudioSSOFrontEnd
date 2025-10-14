import { throttle } from 'lodash';
import { ref, computed, onMounted, onUnmounted } from 'vue';

type WidthType = 'sm' | 'md' | 'lg';
type HeightType = 'sm' | 'md' | 'lg';

export default function useWindowResize() {
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);
  const handleResize = throttle(
    () => {
      width.value = window.innerWidth;
      height.value = window.innerHeight;
    },
    500,
    {
      trailing: true,
      leading: false,
    },
  );
  const widthType = computed((): WidthType => {
    return width.value <= 640 ? 'sm' : width.value <= 960 ? 'md' : 'lg';
  });

  const heightType = computed((): HeightType => {
    return height.value <= 810 ? 'sm' : height.value <= 1080 ? 'md' : 'lg';
  });

  onMounted(() => {
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });

  return {
    width,
    height,
    widthType,
    heightType,
  };
}
