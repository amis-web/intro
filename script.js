const showMoreBtn = document.getElementById('showMoreBtn');
const hiddenCards = document.querySelectorAll('.hidden');

// 状態管理用のフラグ
let isExpanded = false;

showMoreBtn.addEventListener('click', () => {
    if (!isExpanded) {
        // すべてのカードを表示
        hiddenCards.forEach(card => {
            card.classList.remove('hidden'); // hiddenクラスを削除
        });
        showMoreBtn.textContent = '▲折りたたむ'; // ボタンのテキストを変更（折りたたむための矢印）
    } else {
        // すべてのカードを隠す
        hiddenCards.forEach(card => {
            card.classList.add('hidden'); // hiddenクラスを追加
        });
        showMoreBtn.textContent = '▼もっと見る'; // ボタンのテキストを変更（表示するための矢印）
    }
    
    // 状態を反転
    isExpanded = !isExpanded;
});
