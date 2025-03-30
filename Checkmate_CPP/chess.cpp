#include "Checkboard.hpp"
#include <cstdlib>
#include <iostream>
#include <fstream>

int main() {
    Checkboard check_board;
    std::ofstream log("board.txt");
    if (!log.is_open())
        exit(EXIT_FAILURE);
    while(1) {
        // system("clear");
        log << check_board.returnBoard();
        log.seekp(0);
        log.flush();
        // check_board.printBoard();
        check_board.play();
        if (check_board.get_stalemate()) {
            check_board.__valid_move(true);
            log << check_board.returnBoard();
            log << "Stalemated" << std::endl;
            log.seekp(0);
            // system("clear");
            // check_board.printBoard();
        }
        else if (check_board.get_checkmate()) {
            check_board.__valid_move(true);
            log << check_board.returnBoard();
            log << "Mated" << std::endl;
            log.seekp(0);
            // system("clear");
            // check_board.printBoard();
            break;
        }
    }
    // std::cout << "The end of the game" << std::endl;
    return 0;
}